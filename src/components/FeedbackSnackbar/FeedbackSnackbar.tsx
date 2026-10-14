"use client";

import { useFeedbackStore } from "@/store/feedbackStore";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export function FeedbackSnackbar() {
  const message = useFeedbackStore((state) => state.message);
  const severity = useFeedbackStore((state) => state.severity);
  const open = useFeedbackStore((state) => state.open);
  const closeFeedback = useFeedbackStore((state) => state.closeFeedback);

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={closeFeedback}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={closeFeedback}
        severity={severity}
        variant="filled"
        role={severity === "error" ? "alert" : "status"}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
