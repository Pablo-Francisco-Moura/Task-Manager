import type { HonoRequest } from "hono";

export const MAX_NAME_LENGTH = 200;

export async function readJsonObject(
  request: HonoRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

export function parsePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

export function parsePositiveIntegerString(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null;
}

export function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
