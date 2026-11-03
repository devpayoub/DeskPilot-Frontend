import { z } from "zod";

/** The API's own floor: `MIN_PASSWORD_LENGTH` plus Django's length validator. */
export const PASSWORD_MIN_LENGTH = 8;

export const emailField = z.email({ message: "Enter a valid email address." });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: "Enter your password." }),
});

// ---------------------------------------------------------------------------
// Sign up, one schema per step
//
// The form asks for nothing before the previous answer earned it, so the
// validation is staged the same way. Checking a six-digit code client-side is not
// security — the API re-checks everything — it is the reason the Send button can
// say "that is not an email address" without a round trip.
// ---------------------------------------------------------------------------

export const SIGNUP_CODE_LENGTH = 6;

export const signupEmailSchema = z.object({ email: emailField });

export const signupCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(SIGNUP_CODE_LENGTH, { message: `Enter the ${SIGNUP_CODE_LENGTH}-digit code.` })
    .regex(/^\d+$/, { message: "The code is only digits." }),
});

export const signupAccountSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, { message: "Name the account with at least 2 characters." })
    .max(100, { message: "That name is too long." }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` })
    .max(128, { message: "Use 128 characters or fewer." }),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` })
      .max(128, { message: "Use 128 characters or fewer." }),
    confirm_password: z.string(),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupEmailValues = z.infer<typeof signupEmailSchema>;
export type SignupCodeValues = z.infer<typeof signupCodeSchema>;
export type SignupAccountValues = z.infer<typeof signupAccountSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
