import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import useAuthStore from "../store/useAuthStore";

const FAKE_TOKEN = "header.payload.signature";

beforeEach(() => {
  useAuthStore.setState({ token: null });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAuthStore – login", () => {
  it("stores the token and sets state on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => FAKE_TOKEN,
      }),
    );

    const err = await useAuthStore.getState().login("user@example.com", "pass");

    expect(err).toBeNull();
    expect(useAuthStore.getState().token).toBe(FAKE_TOKEN);
    expect(localStorage.getItem("token")).toBe(FAKE_TOKEN);
  });

  it("returns an error message on 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );

    const err = await useAuthStore.getState().login("bad@example.com", "wrong");

    expect(err).toBe("Invalid email or password");
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("returns a generic error on non-403 failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const err = await useAuthStore.getState().login("user@example.com", "pass");

    expect(err).toBe("Login failed");
  });
});

describe("useAuthStore – logout", () => {
  it("clears the token from state and localStorage", () => {
    localStorage.setItem("token", FAKE_TOKEN);
    useAuthStore.setState({ token: FAKE_TOKEN });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
