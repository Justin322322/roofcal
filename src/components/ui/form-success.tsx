interface FormSuccessProps {
  message?: string | null;
}

export default function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return <p className="text-sm text-green-600">{message}</p>;
}
