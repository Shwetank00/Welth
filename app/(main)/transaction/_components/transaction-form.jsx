"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";

export function AddTransactionForm({
  accounts = [],
  categories = [],
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const defaultValues =
    editMode && initialData
      ? {
          type: initialData.type, // "EXPENSE" | "INCOME"
          amount: initialData.amount, // number
          description: initialData.description ?? "",
          accountId: initialData.accountId,
          category: initialData.category, // category id
          date: new Date(initialData.date),
          isRecurring: Boolean(initialData.isRecurring),
          recurringInterval: initialData.recurringInterval ?? undefined,
        }
      : {
          type: "EXPENSE",
          amount: undefined, // RHF will coerce via valueAsNumber
          description: "",
          accountId: accounts.find((ac) => ac.isDefault)?.id ?? accounts[0]?.id,
          date: new Date(),
          isRecurring: false,
          recurringInterval: undefined,
        };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    getValues,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const {
    fn: transactionFn,
    data: transactionResult,
    error: txError,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const selectedAccountId = watch("accountId");
  const selectedCategory = watch("category");

  const filteredCategories = categories.filter((c) => c.type === type);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Clean payload
      const payload = {
        ...data,
        // If recurring toggle is off, drop interval to avoid stale values
        ...(data.isRecurring ? {} : { recurringInterval: undefined }),
      };

      if (editMode) {
        await transactionFn(editId, payload);
        // toast handled by effect for consistency with create
      } else {
        await transactionFn(payload);
      }
    } catch {
      // Any thrown error is handled below by the effect as well
    }
  });

  // Effect: show toast, reset, and navigate after mutation
  useEffect(() => {
    if (!transactionResult && !txError) return;

    if (transactionResult?.success) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );

      // Clear the form only in create mode; keep values in edit
      if (!editMode) {
        reset({
          ...defaultValues,
          // keep selected account so user can add multiple quickly
          accountId: getValues("accountId"),
        });
      }

      const accountIdFromResult =
        transactionResult?.data?.accountId ?? getValues("accountId");
      if (accountIdFromResult) {
        router.push(`/account/${accountIdFromResult}`);
      }
    } else if (txError || transactionResult?.error) {
      const msg =
        transactionResult?.error?.message ||
        (typeof transactionResult?.error === "string"
          ? transactionResult.error
          : undefined) ||
        (typeof txError === "string" ? txError : undefined) ||
        "Failed to save transaction";
      toast.error(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionResult, txError]);

  // Populate from OCR/scan
  const handleScanComplete = (scannedData) => {
    if (!scannedData) return;
    if (scannedData.amount != null) {
      setValue("amount", Number(scannedData.amount), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (scannedData.date) {
      setValue("date", new Date(scannedData.date), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (scannedData.description) {
      setValue("description", scannedData.description, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (scannedData.category) {
      setValue("category", scannedData.category, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    toast.success("Receipt scanned successfully");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Receipt Scanner - create mode only */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={type}
          onValueChange={(v) =>
            setValue("type", v, { shouldDirty: true, shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Amount + Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            value={selectedAccountId}
            onValueChange={(v) =>
              setValue("accountId", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  type="button"
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={selectedCategory}
          onValueChange={(v) =>
            setValue("category", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) =>
                setValue("date", d, { shouldDirty: true, shouldValidate: true })
              }
              disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Recurring */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => {
            setValue("isRecurring", checked, {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (!checked) {
              setValue("recurringInterval", undefined, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            value={watch("recurringInterval")}
            onValueChange={(v) =>
              setValue("recurringInterval", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
