import { PasswordValidation } from "@/lib/password-validator";
import { CheckIcon, CircleIcon } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  validation: PasswordValidation;
}

export default function PasswordStrengthIndicator({
  password,
  validation,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const criteria = [
    { key: "length" as const, label: "At least 8 characters" },
    { key: "uppercase" as const, label: "One uppercase letter" },
    { key: "lowercase" as const, label: "One lowercase letter" },
    { key: "number" as const, label: "One number" },
    { key: "specialChar" as const, label: "One special character" },
  ];

  return (
    <div className="space-y-1 text-xs">
      {criteria.map((criterion) => {
        const isValid = validation.feedback[criterion.key];
        return (
          <div
            key={criterion.key}
            className={`flex items-center gap-2 ${
              isValid ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {isValid ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <CircleIcon className="h-3 w-3" />
            )}
            <span>{criterion.label}</span>
          </div>
        );
      })}
    </div>
  );
}
