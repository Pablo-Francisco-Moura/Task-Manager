"use client";

import {
  selectedTabStorageKey,
  selectedProjectStorageKey,
} from "@/constants/app";
import {
  ROUTES,
  MINIMUM_SESSION_LOADING_FIRST_MS,
  MINIMUM_SESSION_LOADING_REPEAT_MS,
  SESSION_PROGRESS_COMPLETE_DISPLAY_MS,
  SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY,
} from "@/constants";
import { api } from "@/lib/axios";
import { useMainStore } from "@/store/mainStore";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/store/projectStore";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [sessionStatus, setSessionStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    let completionTimer: number | undefined;
    let readyTimer: number | undefined;
    let readyFrame: number | undefined;
    let readyFrameAfterPaint: number | undefined;
    let minimumLoadingTime = MINIMUM_SESSION_LOADING_FIRST_MS;

    try {
      if (
        window.localStorage.getItem(SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY) ===
        "true"
      ) {
        minimumLoadingTime = MINIMUM_SESSION_LOADING_REPEAT_MS;
      }
    } catch {
      minimumLoadingTime = MINIMUM_SESSION_LOADING_FIRST_MS;
    }

    const loadingStartedAt = Date.now();

    setSessionStatus("loading");
    setProgress(0);

    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - loadingStartedAt;
      const elapsedProgress = Math.floor((elapsed / minimumLoadingTime) * 96);
      setProgress(Math.min(elapsedProgress, 96));
    }, 100);

    api
      .post(ROUTES.GUEST_SESSION)
      .then(() => {
        if (!cancelled) {
          const remainingLoadingTime = Math.max(
            minimumLoadingTime - (Date.now() - loadingStartedAt),
            0,
          );
          completionTimer = window.setTimeout(() => {
            if (cancelled) return;
            window.clearInterval(progressInterval);
            try {
              window.localStorage.setItem(
                SESSION_BOOTSTRAP_COMPLETED_STORAGE_KEY,
                "true",
              );
            } catch {}
            setProgress(100);
            readyFrame = window.requestAnimationFrame(() => {
              readyFrameAfterPaint = window.requestAnimationFrame(() => {
                readyTimer = window.setTimeout(() => {
                  if (!cancelled) setSessionStatus("ready");
                }, SESSION_PROGRESS_COMPLETE_DISPLAY_MS);
              });
            });
          }, remainingLoadingTime);
        }
      })
      .catch(() => {
        if (!cancelled) {
          window.clearInterval(progressInterval);
          setSessionStatus("error");
        }
      });

    return () => {
      cancelled = true;
      window.clearInterval(progressInterval);
      if (completionTimer !== undefined) {
        window.clearTimeout(completionTimer);
      }
      if (readyTimer !== undefined) {
        window.clearTimeout(readyTimer);
      }
      if (readyFrame !== undefined) {
        window.cancelAnimationFrame(readyFrame);
      }
      if (readyFrameAfterPaint !== undefined) {
        window.cancelAnimationFrame(readyFrameAfterPaint);
      }
    };
  }, [sessionRetry]);

  useEffect(() => {
    if (sessionStatus !== "ready") return;
    try {
      const storedTab = window.localStorage.getItem(selectedTabStorageKey);
      if (storedTab === "project" || storedTab === "task") {
        useMainStore.getState().setSelectedTab(storedTab);
      }

      const storedProjectId = Number(
        window.localStorage.getItem(selectedProjectStorageKey),
      );
      useProjectStore
        .getState()
        .setSelectedProjectId(
          Number.isSafeInteger(storedProjectId) && storedProjectId > 0
            ? storedProjectId
            : null,
        );
    } catch {
      useProjectStore.getState().setSelectedProjectId(null);
    } finally {
      useProjectStore.getState().setPreferencesLoaded();
    }
  }, [sessionStatus]);

  if (sessionStatus === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_50%),linear-gradient(135deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] px-4 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(17,24,39,1))]"
        role="status"
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-[0_24px_60px_rgba(2,6,23,0.6)]">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl text-white shadow-lg shadow-emerald-500/20">
              ✦
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Workspace
              </p>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("common.sessionLoading")}
              </h2>
            </div>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t("common.sessionLoadingDetail")}</span>
            <span className="font-medium tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === "error") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"
        role="alert"
      >
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-900/60 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600 dark:bg-red-950/90 dark:text-red-300">
            !
          </div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t("common.sessionLoadError")}
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => setSessionRetry((attempt) => attempt + 1)}
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
