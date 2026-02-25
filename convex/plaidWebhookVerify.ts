import {
	createHash,
	createPublicKey,
	createVerify,
	timingSafeEqual,
} from "node:crypto";
import { getPlaidClient } from "./plaidClient";

type VerificationOptions = {
	nowMs?: number;
	maxTokenAgeSeconds?: number;
	getVerificationKey?: (keyId: string) => Promise<{
		alg: string;
		crv: string;
		kid: string;
		kty: string;
		x: string;
		y: string;
	}>;
};

type JwtHeader = {
	alg?: string;
	kid?: string;
};

type JwtPayload = {
	iat?: number;
	request_body_sha256?: string;
};

function decodeBase64Url(input: string) {
	return Buffer.from(input, "base64url");
}

function decodeJson<T>(value: string): T {
	return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

function compareStringsConstantTime(a: string, b: string) {
	const left = Buffer.from(a, "utf8");
	const right = Buffer.from(b, "utf8");
	if (left.length !== right.length) {
		return false;
	}
	return timingSafeEqual(left, right);
}

async function getVerificationKeyFromPlaid(keyId: string) {
	const plaid = getPlaidClient();
	const response = await plaid.webhookVerificationKeyGet({ key_id: keyId });
	return response.data.key;
}

export async function verifyPlaidWebhookSignature(
	body: string,
	plaidVerificationHeader: string | null,
	options?: VerificationOptions,
) {
	if (!plaidVerificationHeader) {
		throw new Error("Missing Plaid-Verification header");
	}

	const [headerB64, payloadB64, signatureB64] =
		plaidVerificationHeader.split(".");
	if (!headerB64 || !payloadB64 || !signatureB64) {
		throw new Error("Invalid Plaid-Verification JWT format");
	}

	const header = decodeJson<JwtHeader>(headerB64);
	if (header.alg !== "ES256") {
		throw new Error("Unsupported Plaid-Verification algorithm");
	}

	if (!header.kid) {
		throw new Error("Missing Plaid-Verification key id");
	}

	const payload = decodeJson<JwtPayload>(payloadB64);
	const requestBodySha256 = payload.request_body_sha256;
	if (!requestBodySha256) {
		throw new Error("Missing webhook body hash claim");
	}

	const nowMs = options?.nowMs ?? Date.now();
	const maxTokenAgeSeconds = options?.maxTokenAgeSeconds ?? 5 * 60;
	if (typeof payload.iat !== "number") {
		throw new Error("Missing webhook iat claim");
	}

	const ageSeconds = Math.floor(nowMs / 1000) - payload.iat;
	if (ageSeconds < -30 || ageSeconds > maxTokenAgeSeconds) {
		throw new Error("Plaid-Verification token outside allowed age window");
	}

	const getVerificationKey =
		options?.getVerificationKey ?? getVerificationKeyFromPlaid;
	const key = await getVerificationKey(header.kid);

	if (key.alg !== "ES256") {
		throw new Error("Unsupported Plaid webhook key algorithm");
	}

	const publicKey = createPublicKey({
		key: {
			kty: key.kty,
			crv: key.crv,
			x: key.x,
			y: key.y,
		},
		format: "jwk",
	});

	const signingInput = `${headerB64}.${payloadB64}`;
	const signature = decodeBase64Url(signatureB64);

	const verifier = createVerify("sha256");
	verifier.update(signingInput);
	verifier.end();

	const signatureIsValid = verifier.verify(
		{
			key: publicKey,
			dsaEncoding: "ieee-p1363",
		},
		signature,
	);

	if (!signatureIsValid) {
		throw new Error("Invalid Plaid webhook signature");
	}

	const computedBodyHash = createHash("sha256")
		.update(body, "utf8")
		.digest("hex");
	if (!compareStringsConstantTime(computedBodyHash, requestBodySha256)) {
		throw new Error("Plaid webhook body hash mismatch");
	}
}
