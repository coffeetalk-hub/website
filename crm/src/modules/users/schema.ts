import { z } from "zod";
import { ROLES } from "@/core/permissions";

const base = {
  name: z.string().min(1, "err:nameRequired").max(100),
  email: z.string().email("err:invalidEmail").max(200),
  role: z.enum(ROLES as [string, ...string[]]),
};

export const createUserSchema = z.object({ ...base, password: z.string().min(8, "err:minPassword").max(100) });
export const updateUserSchema = z.object({ ...base, password: z.string().min(8, "err:minPassword").max(100).optional() });
