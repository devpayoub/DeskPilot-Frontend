import { z } from "zod";

/** Mirrors the backend password validator (minimum 10 characters). */
export const PASSWORD_MIN_LENGTH = 10;

export const emailField = z.email({ message: "Enter a valid email address." });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: "Enter your password." }),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, { message: "Enter your name." })
      .max(255, { message: "That name is too long." }),
    email: emailField,
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
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
