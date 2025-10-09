"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState(
    validatePassword("")
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

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
        setErrorMessage(body?.error ?? "Failed to create account");
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...form.register("password", {
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
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.password.message}
                    </p>
                  )}

                  {/* Password Requirements */}
                  {form.watch("password") && (
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
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
                  {form.watch("password") && form.watch("confirmPassword") && (
                    <div className="text-xs">
                      {form.watch("password") ===
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
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
              Join Thousands of Professionals
            </h2>
            <p className="text-muted-foreground">
              Get access to our professional-grade roof calculation tools. Save
              time, reduce errors, and deliver accurate estimates to your
              clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
