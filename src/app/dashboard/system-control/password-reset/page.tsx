import { Metadata } from "next";
import PasswordResetForm from "@/components/admin/password-reset-form";

export const metadata: Metadata = {
  title: "Password Reset | RoofCalc",
  description: "Reset passwords for contractors and clients",
};

export default function PasswordResetPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-primary text-sm font-semibold">DEV</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Password Reset</h1>
            <p className="text-sm text-muted-foreground">
              Reset passwords for contractors (admins) and clients
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6">
        <div className="flex justify-center">
          <PasswordResetForm />
        </div>
      </div>
    </div>
  );
}
