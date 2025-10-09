import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In - RoofCal",
  description:
    "Sign in to your RoofCal account to access professional roof calculation tools.",
};

export default function LoginPage() {
  return <LoginForm />;
}
