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
		const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

		expect(() => decryptToken(tampered)).toThrow();
	});

	it("supports legacy plain payload reads for migration metadata", () => {
		const result = decryptTokenWithMetadata("plain:legacy-token");
		expect(result).toEqual({ token: "legacy-token", wasLegacyFormat: true });
	});
});
