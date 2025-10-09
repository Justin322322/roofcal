"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyCodeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers and prevent multiple characters
    if (!/^\d*$/.test(value) || value.length > 1) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Update form value
    const code = newOtpValues.join("");
    form.setValue("code", code);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Prevent non-numeric keys except backspace, delete, arrow keys, and tab
    if (
      !/[\d]/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
      return;
    }

    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtpValues = Array.from(
      { length: 6 },
      (_, i) => pastedData[i] || ""
    );
    setOtpValues(newOtpValues);
    form.setValue("code", pastedData);

    // Focus last filled input or first empty
    const lastFilledIndex = pastedData.length - 1;
    if (lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    }
  };

  const onSubmit = async (data: VerifyFormData) => {
    if (!email) {
      setErrorMessage("Email not found. Please go back to signup.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body?.error ?? "Invalid or expired code");
        return;
      }

      setSuccessMessage("Email verified successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorMessage("Email not found. Cannot resend code.");
      return;
    }

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body?.error ?? "Failed to resend code");
        return;
      }

      setSuccessMessage("New code sent to your email!");
      // Clear OTP inputs
      setOtpValues(["", "", "", "", "", ""]);
      form.setValue("code", "");
      inputRefs.current[0]?.focus();
    } catch {
      setErrorMessage("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Verify Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-center">
                Enter the 6-digit code sent to {email || "your email"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex gap-2 justify-center">
                    {otpValues.map((value, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={isLoading}
                        className="w-12 h-12 text-center text-lg font-semibold"
                      />
                    ))}
                  </div>
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-600 text-center">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-600 text-center">
                    {errorMessage}
                  </p>
                )}
                {successMessage && (
                  <p className="text-sm text-green-600 text-center">
                    {successMessage}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the code?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? "Sending..." : "Resend Code"}
                  </Button>
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
              Verify Your Email to Get Started
            </h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a verification code to your email address. Enter
              it below to complete your account setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
