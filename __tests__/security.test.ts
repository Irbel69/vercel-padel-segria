import { runSecurityTest } from "../scripts/test-security";

describe("Security headers & CSP policy", () => {
  it("passes the policy checks", () => {
    const ok = runSecurityTest();
    expect(ok).toBe(true);
  });
});