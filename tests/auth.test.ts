import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  verifyCredentials,
  verifySessionToken,
} from "../lib/auth";

process.env.AUTH_SECRET = "ai-advokat-auth-test-secret";

test("accepts both configured users without case sensitivity", () => {
  assert.deepEqual(verifyCredentials("asiin", "12345"), {
    username: "ASIIN",
    displayName: "Asiin",
  });
  assert.deepEqual(verifyCredentials("Andrey", "12345"), {
    username: "ANDREY",
    displayName: "Andrey",
  });
});

test("rejects invalid credentials", () => {
  assert.equal(verifyCredentials("ASIIN", "wrong"), null);
  assert.equal(verifyCredentials("unknown", "12345"), null);
});

test("creates a verifiable session and rejects tampering", async () => {
  const token = await createSessionToken("ASIIN");
  assert.deepEqual(await verifySessionToken(token), {
    username: "ASIIN",
    displayName: "Asiin",
  });
  assert.equal(await verifySessionToken(`${token}changed`), null);
});
