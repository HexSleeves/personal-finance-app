"use node";

import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { verifyPlaidWebhookSignature } from "./plaidWebhookVerify";

function toBase64Url(input: Buffer | string) {
	return Buffer.from(input).toString("base64url");
}

describe("verifyPlaidWebhookSignature", () => {
	const body = JSON.stringify({
		webhook_type: "TRANSACTIONS",
		webhook_code: "SYNC_UPDATES_AVAILABLE",
	});
	const nowMs = 1_750_000_000_000;
	let kid = "test-kid-1";

	const { privateKey, publicKey } = generateKeyPairSync("ec", {
		namedCurve: "P-256",
	});

	const jwk = publicKey.export({ format: "jwk" }) as {
		kty: string;
		crv: string;
		x: string;
		y: string;
	};

	beforeEach(() => {
		kid = "test-kid-1";
	});

	function signJwt(payloadOverrides?: Record<string, unknown>) {
		const header = { alg: "ES256", kid, typ: "JWT" };
		const payload = {
			iat: Math.floor(nowMs / 1000),
			request_body_sha256: createHash("sha256")
				.update(body, "utf8")
				.digest("hex"),
			...payloadOverrides,
		};

		const encodedHeader = toBase64Url(JSON.stringify(header));
		const encodedPayload = toBase64Url(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const signature = sign("sha256", Buffer.from(signingInput, "utf8"), {
			key: privateKey,
			dsaEncoding: "ieee-p1363",
		});

		return `${signingInput}.${toBase64Url(signature)}`;
	}

	const getVerificationKey = async (requestedKid: string) => {
		if (requestedKid !== kid) {
			throw new Error("unexpected key id");
		}

		return {
			alg: "ES256",
			crv: jwk.crv,
			kid,
			kty: jwk.kty,
			x: jwk.x,
			y: jwk.y,
		};
	};

	it("accepts a valid plaid verification jwt", async () => {
		const jwt = signJwt();

		await expect(
			verifyPlaidWebhookSignature(body, jwt, {
				nowMs,
				getVerificationKey,
			}),
		).resolves.toBeUndefined();
	});

	it("rejects invalid signatures", async () => {
		const jwt = signJwt();
		const [headerB64, payloadB64, signatureB64] = jwt.split(".");
		const signature = Buffer.from(signatureB64, "base64url");
		signature[0] = signature[0] ^ 0b00000001;
		const tampered = `${headerB64}.${payloadB64}.${signature.toString("base64url")}`;

		await expect(
			verifyPlaidWebhookSignature(body, tampered, {
				nowMs,
				getVerificationKey,
			}),
		).rejects.toThrow("Invalid Plaid webhook signature");
	});

	it("rejects body hash mismatches", async () => {
		const jwt = signJwt();

		await expect(
			verifyPlaidWebhookSignature(`${body}x`, jwt, {
				nowMs,
				getVerificationKey,
			}),
		).rejects.toThrow("Plaid webhook body hash mismatch");
	});
});
