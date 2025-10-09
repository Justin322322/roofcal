"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { validatePassword } from "@/lib/password-validator";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RoofCalcLogo from "@/components/RoofCalcLogo";

const resetPasswordSchema = z
  .object({
    code: z.string().length(6, "Code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      setErrorMessage("Email not found. Please go back to forgot password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: data.code,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body?.error ?? "Invalid or expired code");
        return;
      }

      setSuccessMessage("Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center">
                Create a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-digit code"
                    {...form.register("code")}
                    disabled={isLoading}
                    maxLength={6}
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...form.register("newPassword", {
                        onChange: (e) => {
                          setPasswordValidation(
                            validatePassword(e.target.value)
                          );
                        },
                      })}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}

                  {/* Password Requirements */}
                  {form.watch("newPassword") && (
                    <div className="space-y-1 text-xs">
                      <div
                        className={`flex items-center gap-2 ${passwordValidation.feedback.length ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <span>
                          {passwordValidation.feedback.length ? "✓" : "○"}
                        </span>
                        <span>At least 8 characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordValidation.feedback.uppercase ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <span>
                          {passwordValidation.feedback.uppercase ? "✓" : "○"}
                        </span>
                        <span>One uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordValidation.feedback.lowercase ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <span>
                          {passwordValidation.feedback.lowercase ? "✓" : "○"}
                        </span>
                        <span>One lowercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordValidation.feedback.number ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <span>
                          {passwordValidation.feedback.number ? "✓" : "○"}
                        </span>
                        <span>One number</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordValidation.feedback.specialChar ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <span>
                          {passwordValidation.feedback.specialChar ? "✓" : "○"}
                        </span>
                        <span>One special character</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      {...form.register("confirmPassword")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}

                  {/* Password Match Validation */}
                  {form.watch("newPassword") &&
                    form.watch("confirmPassword") && (
                      <div className="text-xs">
                        {form.watch("newPassword") ===
                        form.watch("confirmPassword") ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <span>✓</span>
                            <span>Passwords match</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <span>○</span>
                            <span>Passwords don&apos;t match</span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
                {successMessage && (
                  <p className="text-sm text-green-600">{successMessage}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Back to{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-muted/50">
        <div className="flex flex-col items-center space-y-8 text-center">
          <Link
            href="/"
            className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
          >
            <RoofCalcLogo className="w-16 h-16 text-primary" />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">RoofCal</h1>
              <p className="text-lg text-muted-foreground">
                Professional Roof Calculator
              </p>
            </div>
          </Link>
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Create New Password
            </h2>
            <p className="text-muted-foreground">
              Enter the reset code from your email and create a strong new
              password for your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
