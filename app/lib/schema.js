// app/lib/schema.ts
import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.coerce.number().gte(0, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
    description: z.string().optional(),
    date: z.coerce.date({ required_error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"), // if numeric IDs, use z.coerce.number()
    category: z.string().min(1, "Category is required"), // if numeric IDs, use z.coerce.number()
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });
