"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingButton } from "@/components/ui/loading-button";
import FormError from "@/components/ui/form-error";
import FormSuccess from "@/components/ui/form-success";
import PasswordStrengthIndicator from "@/components/auth/password-strength-indicator";

const forcePasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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

type ForcePasswordChangeFormData = z.infer<typeof forcePasswordChangeSchema>;

export default function ForcePasswordChangeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );
  const router = useRouter();

  const form = useForm<ForcePasswordChangeFormData>({
    resolver: zodResolver(forcePasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ForcePasswordChangeFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        setErrorMessage(responseData.error || "Failed to change password");
        return;
      }

      setSuccessMessage("Password changed successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after successful password change
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Change Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            For security reasons, you must change your password before continuing.
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Update Password
            </CardTitle>
            <CardDescription className="text-center">
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  placeholder="Enter current password"
                  {...form.register("currentPassword")}
                  disabled={isLoading}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <FormError message={errorMessage} />
              <FormSuccess message={successMessage} />

              <LoadingButton
                type="submit"
                className="w-full"
                loading={isLoading}
                loadingText="Updating Password..."
              >
                Update Password
              </LoadingButton>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Security Notice:</strong> This password change is required for your account security. You will be redirected to the dashboard after successfully updating your password.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
