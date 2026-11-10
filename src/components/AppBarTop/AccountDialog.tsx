import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { PasswordField } from "./PasswordField";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ACCOUNT_WORKSPACE_SUGGESTIONS } from "@/constants/session";
import type { TypeAccountDialogMode } from "@/types";

interface IProps {
  open: boolean;
  mode: TypeAccountDialogMode;
  email: string;
  username: string;
  password: string;
  displayName: string;
  submitError: string | null;
  isSubmitting: boolean;
  workspaceName: string;
  confirmPassword: string;
  isPasswordVisible: boolean;
  hasAttemptedSubmit: boolean;
  isConfirmPasswordVisible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (
    field:
      | "email"
      | "username"
      | "password"
      | "displayName"
      | "workspaceName"
      | "confirmPassword",
    value: string,
  ) => void;
  onTogglePassword: (field: "password" | "confirmPassword") => void;
}

export function resolveAccountDialogContent(
  mode: TypeAccountDialogMode,
  t: (key: string) => string,
) {
  const isSignIn = mode === "signIn";
  return {
    title: isSignIn ? t("account.signIn.title") : t("account.create.title"),
    submit: isSignIn ? t("account.signIn.submit") : t("account.create.submit"),
  };
}

export function AccountDialog({
  open,
  mode,
  displayName,
  username,
  email,
  password,
  confirmPassword,
  workspaceName,
  isPasswordVisible,
  isConfirmPasswordVisible,
  hasAttemptedSubmit,
  isSubmitting,
  submitError,
  onChange,
  onTogglePassword,
  onClose,
  onSubmit,
}: IProps) {
  const { t } = useTranslation();
  const [signupStep, setSignupStep] = useState(0);
  const dialogContent = resolveAccountDialogContent(mode, t);
  const isSignIn = mode === "signIn";
  const trimmedUsername = username.trim().toLowerCase();
  const isUsernameValid = /^[a-z0-9._-]{3,32}$/.test(trimmedUsername);
  const hasUsernameInput = username.length > 0;
  const hasPasswordInput = password.length > 0;
  const hasConfirmPasswordInput = confirmPassword.length > 0;
  const passwordsMatch = confirmPassword === password;
  const trimmedEmail = email.trim();
  const isOptionalEmailValid =
    !trimmedEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const signupSteps = [
    t("account.create.stepIdentity"),
    t("account.create.stepSecurity"),
    t("account.create.stepWorkspace"),
  ];
  const canContinue =
    signupStep === 0
      ? Boolean(displayName.trim()) && isUsernameValid && isOptionalEmailValid
      : password.length >= 6 && Boolean(confirmPassword) && passwordsMatch;

  useEffect(() => {
    if (open && !isSignIn) setSignupStep(0);
  }, [open, isSignIn]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogContent.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!isSignIn ? (
            <Typography variant="caption" color="text.secondary">
              {t("common.stepOf", {
                step: signupStep + 1,
                total: signupSteps.length,
              })}
              {" · "}
              {signupSteps[signupStep]}
            </Typography>
          ) : null}
          {!isSignIn && signupStep === 0 ? (
            <>
              <TextField
                label={t("account.displayName")}
                value={displayName}
                onChange={(event) =>
                  onChange("displayName", event.target.value)
                }
                placeholder={t("account.displayNamePlaceholder")}
                autoComplete="name"
                required
                error={hasAttemptedSubmit && !displayName.trim()}
                helperText={
                  hasAttemptedSubmit && !displayName.trim()
                    ? t("account.displayNameRequired")
                    : t("account.displayNameHint")
                }
              />
              <TextField
                label={t("account.login")}
                value={username}
                onChange={(event) => onChange("username", event.target.value)}
                placeholder={t("account.loginPlaceholder")}
                autoComplete="username"
                required
                error={
                  (hasUsernameInput || hasAttemptedSubmit) && !isUsernameValid
                }
                helperText={
                  (hasUsernameInput || hasAttemptedSubmit) && !isUsernameValid
                    ? t("account.loginInvalid")
                    : t("account.loginHint")
                }
                slotProps={{
                  htmlInput: {
                    minLength: 3,
                    maxLength: 32,
                    pattern: "[A-Za-z0-9._\\-]{3,32}",
                  },
                }}
              />
              <TextField
                label={t("account.emailOptional")}
                type="email"
                value={email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder={t("account.emailPlaceholder")}
                autoComplete="email"
                error={
                  !isOptionalEmailValid &&
                  (Boolean(trimmedEmail) || hasAttemptedSubmit)
                }
                helperText={
                  !isOptionalEmailValid &&
                  (Boolean(trimmedEmail) || hasAttemptedSubmit)
                    ? t("account.emailInvalid")
                    : t("account.emailHint")
                }
              />
            </>
          ) : isSignIn ? (
            <TextField
              label={t("account.identifier")}
              value={email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder={t("account.identifierPlaceholder")}
              autoComplete="username"
              error={hasAttemptedSubmit && !email.trim()}
              helperText={
                hasAttemptedSubmit && !email.trim()
                  ? t("account.identifierRequired")
                  : t("account.identifierHint")
              }
            />
          ) : null}
          {isSignIn || signupStep === 1 ? (
            <PasswordField
              label={t("account.password")}
              value={password}
              placeholder={t("account.passwordPlaceholder")}
              error={
                (hasPasswordInput || hasAttemptedSubmit) && password.length < 6
              }
              helperText={
                (hasPasswordInput || hasAttemptedSubmit) && password.length < 6
                  ? t("account.passwordInvalid")
                  : t("account.passwordHint")
              }
              onChange={(value) => onChange("password", value)}
              showLabel={t("account.showPassword")}
              hideLabel={t("account.hidePassword")}
              visible={isPasswordVisible}
              onToggle={() => onTogglePassword("password")}
            />
          ) : null}
          {!isSignIn && signupStep === 1 ? (
            <>
              <PasswordField
                label={t("account.confirmPassword")}
                value={confirmPassword}
                placeholder={t("account.confirmPasswordPlaceholder")}
                error={
                  (hasConfirmPasswordInput || hasAttemptedSubmit) &&
                  (!confirmPassword || !passwordsMatch)
                }
                helperText={
                  hasAttemptedSubmit && !confirmPassword
                    ? t("account.confirmPasswordRequired")
                    : hasConfirmPasswordInput && !passwordsMatch
                      ? t("account.passwordsDoNotMatch")
                      : t("account.confirmPasswordHint")
                }
                onChange={(value) => onChange("confirmPassword", value)}
                showLabel={t("account.showPassword")}
                hideLabel={t("account.hidePassword")}
                visible={isConfirmPasswordVisible}
                onToggle={() => onTogglePassword("confirmPassword")}
              />
            </>
          ) : null}
          {!isSignIn && signupStep === 2 ? (
            <>
              <TextField
                label={t("account.workspaceName")}
                value={workspaceName}
                onChange={(event) =>
                  onChange("workspaceName", event.target.value)
                }
                placeholder={t("account.workspacePlaceholder")}
                helperText={t("account.workspaceHint")}
              />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("account.suggestions")}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mt: 1 }}
                >
                  {ACCOUNT_WORKSPACE_SUGGESTIONS.map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      variant={
                        workspaceName === suggestion ? "filled" : "outlined"
                      }
                      onClick={() => onChange("workspaceName", suggestion)}
                      clickable
                    />
                  ))}
                </Stack>
              </Box>
            </>
          ) : null}
          {submitError ? (
            <Typography color="error.main" variant="body2">
              {submitError}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        {isSignIn ? (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("account.signIn.submitting")
              : dialogContent.submit}
          </Button>
        ) : (
          <>
            {signupStep > 0 ? (
              <Button
                onClick={() => setSignupStep((current) => current - 1)}
                disabled={isSubmitting}
              >
                {t("common.back")}
              </Button>
            ) : null}
            {signupStep < signupSteps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => setSignupStep((current) => current + 1)}
                disabled={isSubmitting || !canContinue}
              >
                {t("common.continue")}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("common.saving") : dialogContent.submit}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
