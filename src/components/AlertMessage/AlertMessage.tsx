import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import styles from "./AlertMessage.module.css";
import CircularProgress from "@mui/material/CircularProgress";

interface IProps {
  message: string;
  type?: "info" | "error" | "loading";
  retryLabel?: string;
  onRetry?: () => void;
}

export function AlertMessage({
  message,
  type = "info",
  retryLabel,
  onRetry,
}: IProps) {
  if (type === "loading") {
    return (
      <div
        className={`${styles.statusMessage} status-message`}
        role="status"
        aria-live="polite"
      >
        <CircularProgress size={18} aria-label={message} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <Alert
      severity={type}
      role={type === "error" ? "alert" : "status"}
      action={
        onRetry && retryLabel ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
