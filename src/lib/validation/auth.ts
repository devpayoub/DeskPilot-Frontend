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

// ---------------------------------------------------------------------------
// Account self-service: the name on a profile, and a password change from inside
// the console. Both mirror the API's own refusal, so the message appears next to
// the box before a round trip — except the ones only the server can know.
// ---------------------------------------------------------------------------

/** The column's ceiling, and the PATCH handler's. */
export const DISPLAY_NAME_MAX_LENGTH = 150;

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX_LENGTH, { message: `Keep it under ${DISPLAY_NAME_MAX_LENGTH} characters.` }),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, { message: "Enter your current password." }),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` })
      .max(128, { message: "Use 128 characters or fewer." }),
    confirm_password: z.string(),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  })
  .refine((values) => values.password !== values.current_password, {
    path: ["password"],
    // Checked here because the server refuses it too, and for the same reason: a
    // change to the same password would sign out every other device for nothing.
    message: "Use a password different from your current one.",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupEmailValues = z.infer<typeof signupEmailSchema>;
export type SignupCodeValues = z.infer<typeof signupCodeSchema>;
export type SignupAccountValues = z.infer<typeof signupAccountSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
