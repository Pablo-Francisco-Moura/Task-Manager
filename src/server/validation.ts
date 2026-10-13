import type { HonoRequest } from "hono";
import { MAX_NAME_LENGTH } from "@/constants";
import type { SharedSchema } from "@/types";

export const projectCreateSchema: SharedSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: MAX_NAME_LENGTH },
  },
  required: ["name"],
  additionalProperties: false,
};

export const projectUpdateSchema: SharedSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: MAX_NAME_LENGTH },
  },
  additionalProperties: false,
};

export const taskCreateSchema: SharedSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: MAX_NAME_LENGTH },
    projectId: { type: "integer", minimum: 1 },
  },
  required: ["name", "projectId"],
  additionalProperties: false,
};

export const taskUpdateSchema: SharedSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: MAX_NAME_LENGTH },
    projectId: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
};

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

export function matchesJsonSchema(
  value: Record<string, unknown>,
  schema: SharedSchema,
): boolean {
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in value)) {
        return false;
      }
    }
  }

  for (const key of Object.keys(value)) {
    if (schema.additionalProperties === false && !(key in schema.properties)) {
      return false;
    }
  }

  for (const [key, property] of Object.entries(schema.properties)) {
    if (!(key in value)) {
      continue;
    }
    const item = value[key];

    if (property.type === "string") {
      if (typeof item !== "string") {
        return false;
      }
      if (
        property.minLength !== undefined &&
        item.trim().length < property.minLength
      ) {
        return false;
      }
      if (
        property.maxLength !== undefined &&
        item.length > property.maxLength
      ) {
        return false;
      }
    }

    if (property.type === "integer") {
      if (typeof item !== "number" || !Number.isInteger(item)) {
        return false;
      }
      if (property.minimum !== undefined && item < property.minimum) {
        return false;
      }
    }
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
