"use client";

import {
  selectedTabStorageKey,
  selectedProjectStorageKey,
} from "@/constants/app";
import {
  MINIMUM_SESSION_LOADING_FIRST_MS,
  SESSION_PROGRESS_COMPLETE_DISPLAY_MS,
} from "@/constants";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    let completionTimer: number | undefined;
    let readyTimer: number | undefined;
    let readyFrame: number | undefined;
    let readyFrameAfterPaint: number | undefined;
    const loadingStartedAt = Date.now();
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - loadingStartedAt;
      const elapsedProgress = Math.floor(
        (elapsed / MINIMUM_SESSION_LOADING_FIRST_MS) * 96,
      );
      setProgress(Math.min(elapsedProgress, 96));
    }, 100);

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
      const remainingLoadingTime = Math.max(
        MINIMUM_SESSION_LOADING_FIRST_MS - (Date.now() - loadingStartedAt),
        0,
      );
      completionTimer = window.setTimeout(() => {
        if (cancelled) return;
        window.clearInterval(progressInterval);
        setProgress(100);
        readyFrame = window.requestAnimationFrame(() => {
          readyFrameAfterPaint = window.requestAnimationFrame(() => {
            readyTimer = window.setTimeout(() => {
              if (!cancelled) setIsReady(true);
            }, SESSION_PROGRESS_COMPLETE_DISPLAY_MS);
          });
        });
      }, remainingLoadingTime);
    }

    return () => {
      cancelled = true;
      window.clearInterval(progressInterval);
      if (completionTimer !== undefined) window.clearTimeout(completionTimer);
      if (readyTimer !== undefined) window.clearTimeout(readyTimer);
      if (readyFrame !== undefined) window.cancelAnimationFrame(readyFrame);
      if (readyFrameAfterPaint !== undefined) {
        window.cancelAnimationFrame(readyFrameAfterPaint);
      }
    };
  }, []);

  if (!isReady) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_50%),linear-gradient(135deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] px-4 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(17,24,39,1))]"
        role="status"
        aria-live="polite"
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

          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-label={t("common.sessionLoading")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t("common.sessionLoadingDetail")}</span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
