"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  // Accessibility-related (optional) wiring
  required?: boolean;
  invalid?: boolean;
  describedById?: string; // id of an error/help element to associate
  groupLabel?: string; // accessible name for the whole OTP control
  groupLabelledById?: string; // alternatively reference an external label
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className,
  required,
  invalid,
  describedById,
  groupLabel,
  groupLabelledById,
}: OTPInputProps) {
  // Initialize state from value prop
  const [otpValues, setOtpValues] = React.useState<string[]>(() =>
    Array.from({ length }, (_, i) => value[i] || "")
  );
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const focusedInputRef = React.useRef<number | null>(null);

  // Helper function to compare arrays shallowly
  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  };

  // Update local state when value prop changes, but only if different
  React.useEffect(() => {
    const newValues = Array.from({ length }, (_, i) => value[i] || "");

    // Only update if the values are actually different or lengths differ
    if (
      !arraysEqual(otpValues, newValues) ||
      otpValues.length !== newValues.length
    ) {
      // Don't update if user is currently typing in an input
      if (focusedInputRef.current === null) {
        setOtpValues(newValues);
      }
    }
  }, [value, length, otpValues]);

  const handleOtpChange = (index: number, inputValue: string) => {
    // Ignore multi-character input - let handlePaste handle paste operations
    if (inputValue.length > 1) return;

    // Only allow numbers for single character input
    if (!/^\d*$/.test(inputValue)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = inputValue;
    setOtpValues(newOtpValues);

    // Update parent component - use useCallback to prevent unnecessary re-renders
    const code = newOtpValues.join("");
    if (code !== value) {
      onChange(code);
    }

    // Auto-focus next input
    if (inputValue && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleFocus = (index: number) => {
    focusedInputRef.current = index;
  };

  const handleBlur = () => {
    focusedInputRef.current = null;
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle Ctrl+V (paste)
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      // Let the paste event handle this
      return;
    }

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

    // Get pasted data from clipboard
    const pastedText = e.clipboardData.getData("text");
    const pastedData = pastedText.replace(/\D/g, "").slice(0, length);

    if (pastedData.length === 0) return;

    // Update the OTP values
    const newOtpValues = Array.from({ length }, (_, i) => pastedData[i] || "");
    setOtpValues(newOtpValues);

    // Only update parent if value is different
    if (pastedData !== value) {
      onChange(pastedData);
    }

    // Clear focus guard since we're programmatically updating
    focusedInputRef.current = null;

    // Focus the last filled input or first empty input
    const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
    setTimeout(() => {
      if (lastFilledIndex < length - 1) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    }, 10);
  };

  return (
    <div
      role="group"
      aria-label={
        groupLabelledById ? undefined : groupLabel || "One-time passcode"
      }
      aria-labelledby={groupLabelledById}
      className={`flex gap-2 justify-center ${className}`}
      onPaste={handlePaste}
    >
      {otpValues.map((inputValue, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`OTP digit ${index + 1} of ${length}`}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={describedById}
          autoComplete={index === 0 ? "one-time-code" : undefined}
          maxLength={1}
          value={inputValue}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}
