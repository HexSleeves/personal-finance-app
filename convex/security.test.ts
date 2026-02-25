"use node";

import { beforeEach, describe, expect, it } from "vitest";
import {
	decryptToken,
	decryptTokenWithMetadata,
	encryptToken,
} from "./security";

const TEST_KEY_B64 = Buffer.from(
	"01234567890123456789012345678901",
	"utf8",
).toString("base64");

describe("security token encryption", () => {
	beforeEach(() => {
		process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY_B64;
	});

	it("roundtrips v2 ciphertext", () => {
		const token = "access-sandbox-token";
		const encrypted = encryptToken(token);

		expect(encrypted.startsWith("v2:")).toBe(true);
		expect(decryptToken(encrypted)).toBe(token);
	});

	it("detects tampered ciphertext", () => {
		const token = "access-sandbox-token";
		const encrypted = encryptToken(token);

		const [prefix, payload] = encrypted.split(":");
		expect(prefix).toBe("v2");
		if (!payload) {
			throw new Error("Expected encrypted payload segment");
		}

		const parts = payload.split(".");
		const ciphertextBytes = Buffer.from(parts[1], "base64url");
		ciphertextBytes[0] = ciphertextBytes[0] ^ 0b00000001;
		parts[1] = ciphertextBytes.toString("base64url");

		const tampered = `${prefix}:${parts.join(".")}`;
		expect(() => decryptToken(tampered)).toThrow();
	});

	it("supports legacy plain payload reads for migration metadata", () => {
		const result = decryptTokenWithMetadata("plain:legacy-token");
		expect(result).toEqual({ token: "legacy-token", wasLegacyFormat: true });
	});
});
