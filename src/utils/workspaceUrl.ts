const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function slugifyWorkspaceName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "workspace";
}

export function workspacePublicId(workspaceId: string): string {
  const normalizedId = workspaceId.replace(/-/g, "");
  const value = BigInt(`0x${normalizedId}`);

  if (value === 0n) {
    return "0";
  }

  let encoded = "";
  let current = value;

  while (current > 0n) {
    const remainder = Number(current % 62n);
    encoded = BASE62_ALPHABET[remainder] + encoded;
    current /= 62n;
  }

  return encoded || "0";
}

export function decodeWorkspacePublicId(publicId: string): string | null {
  if (!/^[0-9A-Za-z]+$/.test(publicId)) {
    return null;
  }

  let value = 0n;

  for (const character of publicId) {
    const index = BASE62_ALPHABET.indexOf(character);
    if (index === -1) {
      return null;
    }

    value = value * 62n + BigInt(index);
  }

  const valueHex = value.toString(16).padStart(32, "0");
  const uuid = [
    valueHex.slice(0, 8),
    valueHex.slice(8, 12),
    valueHex.slice(12, 16),
    valueHex.slice(16, 20),
    valueHex.slice(20, 32),
  ].join("-");

  return uuid;
}

export function workspaceUrl(workspace: { id: string; name: string }) {
  return `/workspace/${workspacePublicId(workspace.id)}/${slugifyWorkspaceName(workspace.name)}`;
}
