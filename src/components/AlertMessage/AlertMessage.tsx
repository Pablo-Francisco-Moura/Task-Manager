interface Props {
  message: string;
  type?: "info" | "error";
}

export function AlertMessage({ message, type = "info" }: Props) {
  const colorClass =
    type === "error"
      ? "text-red-800 dark:text-red-400"
      : "text-blue-800 dark:text-blue-400";

  return <div className={`${colorClass} pulse`}>{message}</div>;
}
