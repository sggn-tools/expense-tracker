/**
 * src/schemas/auth.ts
 * Esquemas Zod para validación de autenticación.
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido")
    .toLowerCase(),
  password: z
    .string({ required_error: "La contraseña es requerida" })
    .min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Mínimo 2 caracteres").max(50).optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
