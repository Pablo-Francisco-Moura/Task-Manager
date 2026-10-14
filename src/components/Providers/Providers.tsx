"use client";

import {
  selectedTabStorageKey,
  selectedProjectStorageKey,
} from "@/constants/app";
import { useMainStore } from "@/store/mainStore";
import { useProjectStore } from "@/store/projectStore";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
