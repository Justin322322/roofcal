"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { validatePassword } from "@/lib/password-validator";

import { Input } from "@/components/ui/input";
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

const createAdminSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine(
    (data) => {
      const validation = validatePassword(data.password);
      return validation.isValid;
    },
    {
      message: "Password does not meet security requirements",
      path: ["password"],
    }
  );

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

interface CreateAdminFormProps {
  onSuccess?: () => void;
}

export default function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );

  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  const onSubmit = async (data: CreateAdminFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        setErrorMessage(responseData.error || "Failed to create admin account");
        return;
      }

      setSuccessMessage("Admin account created successfully! Credentials have been sent to the admin's email address. The admin will be required to change their password on first login.");
      form.reset();
      onSuccess?.();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Admin Account
        </CardTitle>
        <CardDescription className="text-center">
          Create a new admin account for system management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                {...form.register("firstName")}
                disabled={isLoading}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                {...form.register("lastName")}
                disabled={isLoading}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Enter password"
              {...form.register("password", {
                onChange: (e) => {
                  setPasswordValidation(validatePassword(e.target.value));
                },
              })}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
            <PasswordStrengthIndicator
              password={form.watch("password")}
              validation={passwordValidation}
            />
          </div>

          <FormError message={errorMessage} />
          <FormSuccess message={successMessage} />

          <LoadingButton
            type="submit"
            className="w-full"
            loading={isLoading}
            loadingText="Creating Admin..."
          >
            Create Admin Account
          </LoadingButton>
        </form>

        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Email notification:</span> The admin will receive their login credentials via email and will be required to change their password on first login for security purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
