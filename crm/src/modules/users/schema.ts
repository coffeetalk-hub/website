import { z } from "zod";
import { ROLES } from "@/core/permissions";

const base = {
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email").max(200),
  role: z.enum(ROLES as [string, ...string[]]),
};

export const createUserSchema = z.object({ ...base, password: z.string().min(8, "At least 8 characters").max(100) });
export const updateUserSchema = z.object({ ...base, password: z.string().min(8, "At least 8 characters").max(100).optional() });
