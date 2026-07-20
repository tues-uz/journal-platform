export interface AuthorRegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  institution?: string;
}

export type AuthorRegistrationField =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "institution";

export function validateAuthorRegistration(
  input: AuthorRegistrationInput,
): Partial<Record<AuthorRegistrationField, string>> {
  const errors: Partial<Record<AuthorRegistrationField, string>> = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const institution = input.institution?.trim();

  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (institution && institution.length < 2) {
    errors.institution = "Institution name is too short.";
  }

  return errors;
}

export function hasRegistrationErrors(
  errors: Partial<Record<AuthorRegistrationField, string>>,
): boolean {
  return Object.keys(errors).length > 0;
}

export function getRegistrationErrorMessage(
  errors: Partial<Record<AuthorRegistrationField, string>>,
): string {
  return Object.values(errors)[0] ?? "Please check the form and try again.";
}
