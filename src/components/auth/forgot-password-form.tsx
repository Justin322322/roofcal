"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body?.error ?? "Failed to send reset code");
        return;
      }

      setSuccessMessage("Reset code sent to your email!");
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we&apos;ll send you a reset code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...form.register("email")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
                {successMessage && (
                  <p className="text-sm text-green-600">{successMessage}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
              <div className="mt-6">
                <Separator className="my-4" />
                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
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
              Reset Your Password
            </h2>
            <p className="text-muted-foreground">
              No worries! Enter your email address and we&apos;ll send you a
              secure reset code to create a new password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
