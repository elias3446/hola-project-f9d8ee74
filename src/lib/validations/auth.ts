import { z } from "zod";

// Validación segura de email
export const emailSchema = z
  .string()
  .trim()
  .min(3, { message: "El email debe tener al menos 3 caracteres" })
  .max(255, { message: "El email no puede exceder 255 caracteres" })
  .email({ message: "Formato de email inválido" })
  .toLowerCase();

// Validación segura de contraseña
export const passwordSchema = z
  .string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .max(100, { message: "La contraseña no puede exceder 100 caracteres" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula" })
  .regex(/[a-z]/, { message: "Debe contener al menos una letra minúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" })
  .regex(/[^A-Za-z0-9]/, { message: "Debe contener al menos un carácter especial" });

// Validación de nombre
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
  .max(100, { message: "El nombre no puede exceder 100 caracteres" })
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "El nombre solo puede contener letras y espacios" });

// Schema de registro
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Schema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
