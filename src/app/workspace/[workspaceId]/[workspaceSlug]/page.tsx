import { cookies } from "next/headers";
import { Providers } from "@/components/Providers/Providers";
import { workspaceUrl } from "@/utils/workspaceUrl";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { notFound, redirect } from "next/navigation";
import { WorkspaceRouteClient } from "./WorkspaceRouteClient";
import { resolveWorkspaceRoute } from "@/server/workspaceRoute";
import ClientI18nProvider from "@/app/ClientI18nProvider";

interface IProps {
  params: Promise<{ workspaceId: string; workspaceSlug: string }>;
}

export default async function WorkspacePage({ params }: IProps) {
  const { workspaceId, workspaceSlug } = await params;
  const cookieStore = await cookies();
  const result = await resolveWorkspaceRoute(workspaceId, {
    get: (name) => cookieStore.get(name)?.value,
  });

  if (result.kind === "unauthenticated") redirect("/");
  if (result.kind === "notFound") notFound();

  const canonicalUrl = workspaceUrl(result.workspace);
  if (workspaceSlug !== canonicalUrl.split("/").at(-1)) {
    redirect(canonicalUrl);
  }

  return (
    <ClientI18nProvider language="pt">
      <ThemeProvider>
        <Providers>
          <WorkspaceRouteClient
            workspaceId={result.workspace.id}
            workspaceName={result.workspace.name}
            workspaceRole={result.role}
            activeWorkspaceId={result.activeWorkspaceId}
            isAccountSession={result.isAccountSession}
          />
        </Providers>
      </ThemeProvider>
    </ClientI18nProvider>
  );
}
