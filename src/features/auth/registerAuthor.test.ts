import { describe, expect, it } from "vitest";
import {
  getRegistrationErrorMessage,
  hasRegistrationErrors,
  validateAuthorRegistration,
} from "@/features/auth/registerAuthor";

describe("validateAuthorRegistration", () => {
  it("accepts valid author registration input", () => {
    const errors = validateAuthorRegistration({
      name: "Jane Author",
      email: "jane@university.edu",
      password: "secret123",
      confirmPassword: "secret123",
      institution: "Example University",
    });

    expect(hasRegistrationErrors(errors)).toBe(false);
  });

  it("requires matching passwords", () => {
    const errors = validateAuthorRegistration({
      name: "Jane Author",
      email: "jane@university.edu",
      password: "secret123",
      confirmPassword: "different",
    });

    expect(errors.confirmPassword).toBe("Passwords do not match.");
    expect(getRegistrationErrorMessage(errors)).toBe("Passwords do not match.");
  });

  it("rejects invalid email and short password", () => {
    const errors = validateAuthorRegistration({
      name: "Jane",
      email: "not-an-email",
      password: "123",
      confirmPassword: "123",
    });

    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });
});
