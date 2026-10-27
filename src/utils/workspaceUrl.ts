export function slugifyWorkspaceName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "workspace";
}

export function workspaceUrl(workspace: { id: string; name: string }) {
  return `/workspace/${workspace.id}/${slugifyWorkspaceName(workspace.name)}`;
}
