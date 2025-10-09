export interface PasswordValidation {
  isValid: boolean;
  score: number;
  feedback: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
  };
  message: string;
}

export function validatePassword(password: string): PasswordValidation {
  const feedback = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(feedback).filter(Boolean).length;
  const isValid = score >= 4 && feedback.length; // At least 4 criteria met and minimum length

  let message = "";
  if (!isValid) {
    const missing = [];
    if (!feedback.length) missing.push("at least 8 characters");
    if (!feedback.uppercase) missing.push("one uppercase letter");
    if (!feedback.lowercase) missing.push("one lowercase letter");
    if (!feedback.number) missing.push("one number");
    if (!feedback.specialChar) missing.push("one special character");

    message = `Password must contain ${missing.join(", ")}`;
  } else {
    message = "Strong password!";
  }

  return {
    isValid,
    score,
    feedback,
    message,
  };
}

export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return "text-red-600";
  if (score <= 2) return "text-orange-600";
  if (score <= 3) return "text-yellow-600";
  return "text-green-600";
}

export function getPasswordStrengthText(score: number): string {
  if (score <= 1) return "Very Weak";
  if (score <= 2) return "Weak";
  if (score <= 3) return "Fair";
  return "Strong";
}
