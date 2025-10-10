import type { Metadata } from "next";
import SignupForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up - RoofCal",
  description:
    "Create your RoofCal account to access professional roof calculation tools and features.",
};

export default function SignupPage() {
  return <SignupForm />;
}
