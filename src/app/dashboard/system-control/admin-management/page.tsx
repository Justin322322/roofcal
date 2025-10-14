import { Metadata } from "next";
import CreateAdminForm from "@/components/admin/create-admin-form";

export const metadata: Metadata = {
  title: "Admin Management | RoofCalc",
  description: "Manage admin accounts and system administration",
};

export default function AdminManagementPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-primary text-sm font-semibold">DEV</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage admin accounts for system administration
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6">
        <div className="flex justify-center">
          <CreateAdminForm />
        </div>
      </div>
    </div>
  );
}
