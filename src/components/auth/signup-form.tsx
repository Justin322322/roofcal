"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingButton } from "@/components/ui/loading-button";
import FormError from "@/components/ui/form-error";
import PasswordStrengthIndicator from "@/components/auth/password-strength-indicator";
import PasswordMatchIndicator from "@/components/auth/password-match-indicator";
import AuthLayout from "@/components/auth/auth-layout";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        // Handle specific error messages from the API
        let errorMsg = "Failed to create account";

        if (body?.error) {
          switch (body.error) {
            case "Email already in use":
              errorMsg = "An account with this email address already exists";
              break;
            case "Invalid email format":
              errorMsg = "Please enter a valid email address";
              break;
            case "Password too weak":
              errorMsg = "Password does not meet security requirements";
              break;
            case "Failed to send verification email. Please try again.":
              errorMsg =
                "We couldn't send you a verification email. Please check your email address and try again.";
              break;
            default:
              errorMsg = body.error;
          }
        }

        setErrorMessage(errorMsg);
        toast.error("Account creation failed");
        return;
      }

      // Show success message and redirect with delay for better UX
      toast.success(
        "Account created successfully! Please check your email for verification."
      );
      timeoutRef.current = window.setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(data.email)}`);
      }, 1000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (
    <AuthLayout
      brandingTitle="Join Thousands of Professionals"
      brandingDescription="Get access to our professional-grade roof calculation tools. Save time, reduce errors, and deliver accurate estimates to your clients."
    >
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details to create your RoofCal account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
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
                    placeholder="Last Name"
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
                  placeholder="firstname.lastname@bpsu.edu.ph"
                  autoComplete="email"
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                  disabled={isLoading}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
                <PasswordMatchIndicator
                  password={form.watch("password")}
                  confirmPassword={form.watch("confirmPassword")}
                />
              </div>
              <FormError message={errorMessage} />
              <LoadingButton
                type="submit"
                className="w-full"
                loading={isLoading}
                loadingText="Creating Account..."
              >
                Create Account
              </LoadingButton>
            </form>
            <div className="mt-6">
              <Separator className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
