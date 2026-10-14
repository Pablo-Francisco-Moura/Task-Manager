import { z } from "zod";
import { MAX_NAME_LENGTH } from "@/constants";
import type { TypeSharedSchema } from "@/types/validation";
import type { HonoRequest } from "hono";

const nameSchema = z.string().min(1).max(MAX_NAME_LENGTH).regex(/\S/);
const projectIdSchema = z.int().positive();

export const projectCreateSchema = z.strictObject({ name: nameSchema });
export const projectUpdateSchema = z.strictObject({
  name: nameSchema.optional(),
});
export const taskCreateSchema = z.strictObject({
  name: nameSchema,
  projectId: projectIdSchema,
});
export const taskUpdateSchema = z.strictObject({
  name: nameSchema.optional(),
  projectId: projectIdSchema.optional(),
});

const openApiSchemaOptions = { target: "openapi-3.0" as const };
export const projectCreateOpenApiSchema = z.toJSONSchema(
  projectCreateSchema,
  openApiSchemaOptions,
) as unknown as TypeSharedSchema;
export const projectUpdateOpenApiSchema = z.toJSONSchema(
  projectUpdateSchema,
  openApiSchemaOptions,
) as unknown as TypeSharedSchema;
export const taskCreateOpenApiSchema = z.toJSONSchema(
  taskCreateSchema,
  openApiSchemaOptions,
) as unknown as TypeSharedSchema;
export const taskUpdateOpenApiSchema = z.toJSONSchema(
  taskUpdateSchema,
  openApiSchemaOptions,
) as unknown as TypeSharedSchema;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
