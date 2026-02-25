"use node";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const LEGACY_TOKEN_PREFIX = "v1:";
const TOKEN_PREFIX = "v2:";
const LEGACY_PLAIN_PREFIX = "plain:";
const IV_LENGTH_BYTES = 12;

type DecryptTokenResult = {
	token: string;
	wasLegacyFormat: boolean;
};

function getEncryptionKeyMaterial() {
	const raw = process.env.TOKEN_ENCRYPTION_KEY;
	if (!raw) {
		throw new Error("TOKEN_ENCRYPTION_KEY is required");
	}

	const key = Buffer.from(raw, "base64");
	if (key.length !== 32) {
		throw new Error("TOKEN_ENCRYPTION_KEY must be base64-encoded 32-byte key");
	}

	return { raw, key };
}

export function encryptToken(token: string) {
	const { key } = getEncryptionKeyMaterial();
	const iv = randomBytes(IV_LENGTH_BYTES);
	const cipher = createCipheriv("aes-256-gcm", key, iv);

	const encrypted = Buffer.concat([
		cipher.update(token, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return `${TOKEN_PREFIX}${iv.toString("base64url")}.${encrypted.toString(
		"base64url",
	)}.${authTag.toString("base64url")}`;
}

function decryptV2(payload: string, key: Buffer) {
	const [ivEncoded, ciphertextEncoded, authTagEncoded] = payload
		.slice(TOKEN_PREFIX.length)
		.split(".");

	if (!ivEncoded || !ciphertextEncoded || !authTagEncoded) {
		throw new Error("Invalid token payload format");
	}

	const iv = Buffer.from(ivEncoded, "base64url");
	const ciphertext = Buffer.from(ciphertextEncoded, "base64url");
	const authTag = Buffer.from(authTagEncoded, "base64url");

	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);

	return Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]).toString("utf8");
}

function decryptLegacyV1(payload: string, rawKey: string) {
	const decoded = Buffer.from(
		payload.slice(LEGACY_TOKEN_PREFIX.length),
		"base64url",
	).toString("utf8");

	const prefix = `${rawKey}:`;
	if (!decoded.startsWith(prefix)) {
		throw new Error("Invalid token key");
	}

	return decoded.slice(prefix.length);
}

export function decryptToken(payload: string): string {
	return decryptTokenWithMetadata(payload).token;
}

export function decryptTokenWithMetadata(payload: string): DecryptTokenResult {
	const { raw, key } = getEncryptionKeyMaterial();

	if (payload.startsWith(TOKEN_PREFIX)) {
		return {
			token: decryptV2(payload, key),
			wasLegacyFormat: false,
		};
	}

	if (payload.startsWith(LEGACY_TOKEN_PREFIX)) {
		return {
			token: decryptLegacyV1(payload, raw),
			wasLegacyFormat: true,
		};
	}

	if (payload.startsWith(LEGACY_PLAIN_PREFIX)) {
		return {
			token: payload.slice(LEGACY_PLAIN_PREFIX.length),
			wasLegacyFormat: true,
		};
	}

	throw new Error("Unsupported token format");
}
