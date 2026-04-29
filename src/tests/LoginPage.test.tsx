import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../components/LoginPage";
import useAuthStore from "../store/useAuthStore";

// Reset auth store state between tests
beforeEach(() => {
  useAuthStore.setState({ token: null });
});

describe("LoginPage", () => {
  it("renders email, password fields and a Sign in button", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitted empty", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();
    expect(await screen.findByText(/please enter your password/i)).toBeInTheDocument();
  });

  it("calls login with the entered credentials", async () => {
    const login = vi.fn().mockResolvedValue(null);
    useAuthStore.setState({ login } as never);

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("user@example.com", "secret"));
  });

  it("displays an error message returned by login", async () => {
    const login = vi.fn().mockResolvedValue("Invalid email or password");
    useAuthStore.setState({ login } as never);

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("does not display an error when login succeeds", async () => {
    const login = vi.fn().mockResolvedValue(null);
    useAuthStore.setState({ login } as never);

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "correct");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
