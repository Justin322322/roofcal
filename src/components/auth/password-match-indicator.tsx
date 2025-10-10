export const messages = {
  match: "Passwords match",
  noMatch: "Passwords don't match",
} as const;

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export default function PasswordMatchIndicator({
  password,
  confirmPassword,
}: PasswordMatchIndicatorProps) {
  if (!password || !confirmPassword) return null;

  const passwordsMatch = password === confirmPassword;

  return (
    <div className="text-xs">
      {passwordsMatch ? (
        <div className="flex items-center gap-2 text-green-600">
          <span>✓</span>
          <span>{messages.match}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <span>○</span>
          <span>{messages.noMatch}</span>
        </div>
      )}
    </div>
  );
}
