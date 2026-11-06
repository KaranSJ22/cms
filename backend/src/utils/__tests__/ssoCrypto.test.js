import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "../ssoCrypto.js";
import { UnauthorizedError } from "../../common/errors/appError.js";

describe("ssoCrypto Helper", () => {
  it("should encrypt and decrypt username successfully (roundtrip)", () => {
    const username = "testuser123";
    const encryptedToken = encryptToken(username);

    expect(encryptedToken).toBeTypeOf("string");
    expect(encryptedToken.length).toBeGreaterThan(0);
    // Base64Url format should not contain +, /, or =
    expect(encryptedToken).not.toMatch(/[+/=]/);

    const decrypted = decryptToken(encryptedToken);
    expect(decrypted).toBeTypeOf("string");
    expect(decrypted.startsWith(`${username}:`)).toBe(true);

    const [decryptedUser, expiryStr] = decrypted.split(":");
    expect(decryptedUser).toBe(username);
    const expiry = Number(expiryStr);
    expect(Number.isFinite(expiry)).toBe(true);
    expect(expiry).toBeGreaterThan(Date.now());
  });

  it("should throw UnauthorizedError when decrypting invalid or corrupted token", () => {
    expect(() => decryptToken("not-a-valid-token")).toThrow(UnauthorizedError);
    expect(() => decryptToken("")).toThrow(UnauthorizedError);
  });
});
