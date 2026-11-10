import { useTranslation } from "react-i18next";
import { WorkspaceInviteBell } from "../Notifications/WorkspaceInviteBell";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import type { TypeAccountDialogMode, TypeAccountSessionState } from "@/types";
import styles from "./AppBarTop.module.css";
import { BrandIcon } from "@/components/BrandIcon/BrandIcon";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface IProps {
  language: "pt" | "en";
  profileAnchor: HTMLElement | null;
  accountSession: TypeAccountSessionState | null;
  onOpenProfile: (anchor: HTMLElement) => void;
  onInviteAccepted: () => void;
  onOpenAccountDialog: (mode: TypeAccountDialogMode) => void;
}

export function AppBarHeader({
  language,
  profileAnchor,
  accountSession,
  onOpenProfile,
  onInviteAccepted,
  onOpenAccountDialog,
}: IProps) {
  const { t } = useTranslation();

  return (
    <header className={`${styles.header} app-header w-full transition-colors`}>
      <div className="app-header-inner flex w-full items-center justify-between px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandIcon className="app-brand-mark h-10 w-10 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <h1 className="app-brand-title truncate">{t("app.title")}</h1>
            {accountSession ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("account.workspaceLabel")} · {accountSession.workspaceName}
              </Typography>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!accountSession ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="text"
                onClick={() => onOpenAccountDialog("signIn")}
              >
                {t("account.signIn.button")}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => onOpenAccountDialog("signUp")}
              >
                {t("account.create.button")}
              </Button>
            </Stack>
          ) : null}
          <WorkspaceInviteBell
            enabled={Boolean(accountSession)}
            language={language}
            onInviteAccepted={onInviteAccepted}
          />
          <IconButton
            aria-label={t("profile.open")}
            aria-haspopup="menu"
            aria-expanded={Boolean(profileAnchor)}
            onClick={(event) => onOpenProfile(event.currentTarget)}
            color={profileAnchor ? "secondary" : "inherit"}
          >
            <AccountCircleIcon />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
