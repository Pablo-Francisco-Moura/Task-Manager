"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Menu,
  Stack,
  Dialog,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";
import {
  GUEST_PROFILE_STORAGE_KEY,
  ACCOUNT_SESSION_STORAGE_KEY,
  ACCOUNT_WORKSPACE_SUGGESTIONS,
} from "@/constants/session";
import { ThemeSwitch } from "../ThemeSwitch";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import type { TypeAccountSessionState, TypeGuestProfileState } from "@/types";
import styles from "./AppBarTop.module.css";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

export function AppBarTop() {
  const { t, i18n } = useTranslation();
  const language = i18n.language.startsWith("en") ? "en" : "pt";
  const [displayName, setDisplayName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [guestProfile, setGuestProfile] = useState<TypeGuestProfileState>({
    displayName: "",
  });
  const [editedProfileName, setEditedProfileName] = useState("");
  const [accountSession, setAccountSession] =
    useState<TypeAccountSessionState | null>(null);

  useEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(
        ACCOUNT_SESSION_STORAGE_KEY,
      );
      if (!savedValue) return;

      const parsedValue = JSON.parse(
        savedValue,
      ) as Partial<TypeAccountSessionState>;
      const nextDisplayName =
        typeof parsedValue.displayName === "string" &&
        parsedValue.displayName.trim()
          ? parsedValue.displayName.trim()
          : "";
      const nextWorkspaceName =
        typeof parsedValue.workspaceName === "string" &&
        parsedValue.workspaceName.trim()
          ? parsedValue.workspaceName.trim()
          : "Pessoal";

      setAccountSession({
        displayName: nextDisplayName,
        workspaceName: nextWorkspaceName,
      });
    } catch {
      setAccountSession(null);
    }
  }, []);
  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(GUEST_PROFILE_STORAGE_KEY);
      if (!savedProfile) return;

      const parsedProfile = JSON.parse(savedProfile) as Partial<TypeGuestProfileState>;
      setGuestProfile({
        displayName:
          typeof parsedProfile.displayName === "string"
            ? parsedProfile.displayName.trim()
            : "",
      });
    } catch {
      setGuestProfile({ displayName: "" });
    }
  }, []);


  const selectLanguage = (nextLanguage: "pt" | "en") => {
    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
    try {
      window.localStorage.setItem("language", nextLanguage);
    } catch {
      // The current selection still applies for this session.
    }
  };

  const openCreateAccountDialog = () => {
    setDisplayName(
      accountSession?.displayName ||
        guestProfile.displayName ||
        t("profile.unnamed"),
    );
    setSubmitError(null);
    setIsCreateAccountOpen(true);
  };

  const saveGuestProfileName = () => {
    const nextProfile = { displayName: editedProfileName.trim() };

    try {
      window.localStorage.setItem(
        GUEST_PROFILE_STORAGE_KEY,
        JSON.stringify(nextProfile),
      );
    } catch {
      // Keep the edited profile available for the current session.
    }

    setGuestProfile(nextProfile);
    setIsEditProfileOpen(false);
  };

  const closeCreateAccountDialog = () => {
    setIsCreateAccountOpen(false);
    setSubmitError(null);
  };

  const handleCreateAccount = async () => {
    const trimmedDisplayName = displayName.trim() || t("profile.unnamed");
    const trimmedWorkspaceName =
      workspaceName.trim() || t("account.workspaceDefault");

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/session/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          displayName: trimmedDisplayName,
          workspaceName: trimmedWorkspaceName,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : t("account.create.error"),
        );
      }

      const nextAccountSession: TypeAccountSessionState = {
        displayName:
          typeof payload.user?.displayName === "string" &&
          payload.user.displayName.trim()
            ? payload.user.displayName.trim()
            : trimmedDisplayName,
        workspaceName:
          typeof payload.workspaceName === "string" &&
          payload.workspaceName.trim()
            ? payload.workspaceName.trim()
            : trimmedWorkspaceName,
      };

      try {
        window.localStorage.setItem(
          ACCOUNT_SESSION_STORAGE_KEY,
          JSON.stringify(nextAccountSession),
        );
      } catch {
        // Keep the active account state in memory even when storage is unavailable.
      }

      setAccountSession(nextAccountSession);
      setDisplayName("");
      setWorkspaceName("");
      closeCreateAccountDialog();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("account.create.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header
        className={`${styles.header} app-header w-full transition-colors`}
      >
        <div className="app-header-inner mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="app-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <WorkspacesOutlinedIcon fontSize="small" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="app-brand-title truncate">{t("app.title")}</h1>
              {accountSession ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {accountSession.displayName || "Usuário"} ·{" "}
                  {accountSession.workspaceName}
                </Typography>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accountSession ? (
              <Chip
                size="small"
                label={accountSession.workspaceName}
                color="primary"
                variant="outlined"
              />
            ) : (
              <Button
                size="small"
                variant="outlined"
                onClick={openCreateAccountDialog}
              >
                {t("account.create.button")}
              </Button>
            )}
            <ButtonGroup size="small" aria-label={t("app.language")}>
              <Button
                aria-pressed={language === "pt"}
                onClick={() => selectLanguage("pt")}
                variant={language === "pt" ? "contained" : "outlined"}
              >
                PT
              </Button>
              <Button
                aria-pressed={language === "en"}
                onClick={() => selectLanguage("en")}
                variant={language === "en" ? "contained" : "outlined"}
              >
                EN
              </Button>
            </ButtonGroup>
            <ThemeSwitch />
            <IconButton
              aria-label={t("profile.open")}
              aria-haspopup="menu"
              aria-expanded={Boolean(profileAnchor)}
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              color="inherit"
            >
              <AccountCircleOutlinedIcon />
            </IconButton>
          </div>
        </div>
      </header>

      <Dialog
        open={isCreateAccountOpen}
        onClose={closeCreateAccountDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("account.create.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t("account.displayName")}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("account.displayName")}
            />
            <TextField
              label={t("account.workspaceName")}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder={t("account.workspacePlaceholder")}
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
                    onClick={() => setWorkspaceName(suggestion)}
                    clickable
                  />
                ))}
              </Stack>
            </Box>
            {submitError ? (
              <Typography color="error.main" variant="body2">
                {submitError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateAccountDialog} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.saving") : t("account.create.submit")}
          </Button>
        </DialogActions>
      </Dialog>


      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ minWidth: 240, px: 2, py: 1 }}>
          <Typography variant="overline" color="text.secondary">
            {accountSession ? t("profile.account") : t("profile.guest")}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1" sx={{ flex: 1 }} noWrap>
              {accountSession?.displayName ||
                guestProfile.displayName ||
                t("profile.unnamed")}
            </Typography>
            {!accountSession ? (
              <IconButton
                size="small"
                aria-label={t("profile.editName")}
                title={t("profile.editName")}
                onClick={() => {
                  setEditedProfileName(guestProfile.displayName);
                  setProfileAnchor(null);
                  setIsEditProfileOpen(true);
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
          {accountSession ? (
            <Typography variant="caption" color="text.secondary">
              {accountSession.workspaceName}
            </Typography>
          ) : null}
        </Box>
        {!accountSession ? (
          <MenuItem
            onClick={() => {
              setProfileAnchor(null);
              openCreateAccountDialog();
            }}
          >
            {t("account.create.button")}
          </MenuItem>
        ) : null}
      </Menu>

      <Dialog
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("profile.editTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("account.displayName")}
            value={editedProfileName}
            onChange={(event) => setEditedProfileName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveGuestProfileName();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditProfileOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={saveGuestProfileName}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
