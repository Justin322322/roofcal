import { Metadata } from "next";
import CreateAdminForm from "@/components/admin/create-admin-form";

export const metadata: Metadata = {
  title: "Admin Management | RoofCalc",
  description: "Manage admin accounts and system administration",
};

export default function AdminManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
        <p className="text-muted-foreground">
          Create and manage admin accounts for system administration.
        </p>
      </div>

      <div className="flex justify-center">
        <CreateAdminForm />
      </div>
    </div>
  );
}
