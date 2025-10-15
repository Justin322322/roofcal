"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

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
import AuthLayout from "@/components/auth/auth-layout";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Use NextAuth's built-in redirect mechanism
      // This ensures proper session establishment and redirect handling
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        // Handle specific error messages from NextAuth
        let errorMsg = "Something went wrong. Please try again.";
        let toastMsg = "Login failed";

        switch (result.error) {
          case "EMAIL_NOT_FOUND":
            errorMsg = "No account found with this email address";
            toastMsg = "Email address not found";
            break;
          case "INVALID_PASSWORD":
            errorMsg = "Invalid password";
            toastMsg = "Invalid password";
            break;
          case "ACCOUNT_DISABLED":
            errorMsg = "Your account has been restricted. Please contact support.";
            toastMsg = "Account restricted";
            break;
          case "CredentialsSignin":
            // Fallback for generic credential errors
            const emailSchema = z.string().email();
            const isEmailValid = emailSchema.safeParse(data.email).success;
            if (isEmailValid) {
              errorMsg = "Invalid password";
              toastMsg = "Invalid password";
            } else {
              errorMsg = "Please enter a valid email address";
              toastMsg = "Invalid email format";
            }
            break;
          default:
            errorMsg = result.error;
            toastMsg = "Login failed";
        }

        setErrorMessage(errorMsg);
        toast.error(toastMsg);

        // Clear password field
        form.setValue("password", "");

        setIsLoading(false);
        return;
      }

      // Login succeeded - show success feedback
      toast.success("Successfully signed in!");

      // Reset loading state immediately after scheduling redirect
      setIsLoading(false);

      // Use NextAuth's redirect mechanism to ensure proper session handling
      // This will properly establish the session and redirect
      window.location.href = result?.url || "/dashboard";
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      form.setValue("password", "");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      brandingTitle="Calculate Your Roofing Project with Precision"
      brandingDescription="Get accurate roofing measurements, material estimates, and cost calculations. Built for contractors and homeowners who demand professional results."
    >
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sign in
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <FormError message={errorMessage} />
              <LoadingButton
                type="submit"
                className="w-full"
                loading={isLoading}
                loadingText="Signing in..."
              >
                Sign in
              </LoadingButton>
            </form>
            <div className="mt-6">
              <Separator className="my-4" />
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
