import { Suspense } from "react";
import VerifyCodeForm from "@/components/auth/verify-code-form";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyCodeForm />
    </Suspense>
  );
}
