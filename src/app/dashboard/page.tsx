import { Suspense } from "react";
import DashboardClient from "./dashboard-client";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <DashboardClient />
    </Suspense>
  );
}
