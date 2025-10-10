import { useId } from "react";

interface FormErrorProps {
  message?: string | null;
  id?: string;
}

export default function FormError({ message, id }: FormErrorProps) {
  const generatedId = useId();
  // Sanitize the generatedId so it's a valid HTML id and safe for CSS/querySelector
  let sanitizedGeneratedId = generatedId
    .replace(/:/g, "-") // replace colons which are common in React useId()
    .replace(/[^A-Za-z0-9_\-:.]/g, ""); // strip anything outside allowed set

  // Ensure the id starts with a letter to satisfy HTML/CSS/querySelector constraints
  if (!/^[A-Za-z]/.test(sanitizedGeneratedId)) {
    sanitizedGeneratedId = `a${sanitizedGeneratedId}`;
  }

  const errorId = id || `form-error-${sanitizedGeneratedId}`;

  if (!message) return null;

  return (
    <p
      id={errorId}
      role="alert"
      aria-live="assertive"
      className="text-sm text-red-600"
    >
      {message}
    </p>
  );
}
