"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { validatePassword } from "@/lib/password-validator";


import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingButton } from "@/components/ui/loading-button";
import { Checkbox } from "@/components/ui/checkbox";
import FormError from "@/components/ui/form-error";
import FormSuccess from "@/components/ui/form-success";
import PasswordStrengthIndicator from "@/components/auth/password-strength-indicator";

const resetPasswordSchema = z
  .object({
    userId: z.string().min(1, "Please select a user"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    requirePasswordChange: z.boolean(),
  })
  .refine(
    (data) => {
      const validation = validatePassword(data.newPassword);
      return validation.isValid;
    },
    {
      message: "Password does not meet security requirements",
      path: ["newPassword"],
    }
  );

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  passwordChangeRequired: boolean;
}

export default function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: "",
      newPassword: "",
      requirePasswordChange: true,
    },
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          // Filter to show only ADMIN and CLIENT users
          const filteredUsers = data.users.filter(
            (user: User) => user.role === "ADMIN" || user.role === "CLIENT"
          );
          setUsers(filteredUsers);
        } else {
          setErrorMessage("Failed to load users");
        }
      } catch {
        setErrorMessage("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        setErrorMessage(responseData.error || "Failed to reset password");
        return;
      }

      const userName = responseData.user?.name || "User";
      const userEmail = responseData.user?.email || "";
      
      setSuccessMessage(
        `Password reset successfully for ${userName} (${userEmail}). ${
          data.requirePasswordChange
            ? "User will be required to change password on next login."
            : "User can now login with the new password."
        }`
      );
      
      form.reset({
        userId: "",
        newPassword: "",
        requirePasswordChange: true,
      });
      setPasswordValidation(validatePassword(""));
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === form.watch("userId"));

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-2xl font-bold text-center">
          Reset User Password
        </CardTitle>
        <CardDescription className="text-center text-sm">
          Reset password for contractors (admins) and clients
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Select User</Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Select
                value={form.watch("userId")}
                onValueChange={(value) => form.setValue("userId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.userId && (
              <p className="text-sm text-red-600">
                {form.formState.errors.userId.message}
              </p>
            )}
          </div>

          {selectedUser && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-1">Selected User:</p>
              <p className="text-sm text-muted-foreground">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-medium">{selectedUser.role}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Current Status:{" "}
                <span className={selectedUser.passwordChangeRequired ? "font-medium text-orange-600" : "font-medium text-green-600"}>
                  {selectedUser.passwordChangeRequired ? "Password change required" : "Active"}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              placeholder="Enter new password"
              {...form.register("newPassword", {
                onChange: (e) => {
                  setPasswordValidation(validatePassword(e.target.value));
                },
              })}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault();
                }
              }}
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-red-600">
                {form.formState.errors.newPassword.message}
              </p>
            )}
            <PasswordStrengthIndicator
              password={form.watch("newPassword")}
              validation={passwordValidation}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requirePasswordChange"
              checked={form.watch("requirePasswordChange")}
              onCheckedChange={(checked) =>
                form.setValue("requirePasswordChange", checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="requirePasswordChange"
              className="text-sm font-normal cursor-pointer"
            >
              Require password change on next login
            </Label>
          </div>

          <FormError message={errorMessage} />
          <FormSuccess message={successMessage} />

          <LoadingButton
            type="submit"
            className="w-full"
            loading={isLoading}
            loadingText="Resetting Password..."
            disabled={!form.watch("userId") || loadingUsers}
          >
            Reset Password
          </LoadingButton>
        </form>

        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Security note:</span> This action will
            immediately update the user&apos;s password. If &quot;Require password
            change&quot; is checked, the user will be prompted to set a new password
            on their next login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
