"use client";

import { useRouter } from "next/navigation";
import { MainScreen } from "@/screens/Main";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useEffect, useState } from "react";
import { accountWorkspaceRequest } from "@/lib/accountWorkspaceApi";
import { ACCOUNT_SESSION_STORAGE_KEY } from "@/constants/session";

interface IProps {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: "owner" | "member";
  activeWorkspaceId: string;
  isAccountSession: boolean;
}

export function WorkspaceRouteClient({
  workspaceId,
  workspaceName,
  workspaceRole,
  activeWorkspaceId,
  isAccountSession,
}: IProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const canonicalUrl = workspaceUrl({ id: workspaceId, name: workspaceName });

  useEffect(() => {
    if (window.location.pathname !== canonicalUrl) {
      router.replace(canonicalUrl);
    }
  }, [canonicalUrl, router]);

  useEffect(() => {
    let isCurrent = true;
    const workspaceStore = useProjectStore.getState();
    workspaceStore.setActiveWorkspaceId(workspaceId);
    workspaceStore.setWorkspaceRole(workspaceRole);
    workspaceStore.setSelectedProject(null);

    const selectWorkspace = async () => {
      try {
        if (isAccountSession && activeWorkspaceId !== workspaceId) {
          await accountWorkspaceRequest("/api/session/workspace", {
            method: "PATCH",
            body: JSON.stringify({ workspaceId }),
          });
        }
        if (isAccountSession) {
          try {
            const storedSession = window.localStorage.getItem(
              ACCOUNT_SESSION_STORAGE_KEY,
            );
            if (storedSession) {
              const parsedSession = JSON.parse(storedSession) as Record<
                string,
                unknown
              >;
              window.localStorage.setItem(
                ACCOUNT_SESSION_STORAGE_KEY,
                JSON.stringify({
                  ...parsedSession,
                  workspaceId,
                  workspaceName,
                }),
              );
            }
          } catch {
            // The server session remains authoritative if browser storage is unavailable.
          }
        }
        if (isCurrent) setIsReady(true);
      } catch {
        if (isCurrent) setIsUnavailable(true);
      }
    };

    void selectWorkspace();
    return () => {
      isCurrent = false;
    };
  }, [
    activeWorkspaceId,
    isAccountSession,
    workspaceId,
    workspaceName,
    workspaceRole,
  ]);

  if (isUnavailable) {
    return (
      <main className="content-state" role="alert">
        <p>{t("common.workspaceNotFound")}</p>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="content-state" role="status" aria-busy="true">
        {t("common.sessionLoading")}
      </main>
    );
  }

  return <MainScreen />;
}
