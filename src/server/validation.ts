import { z } from "zod";
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "@/constants";
import type { HonoRequest } from "hono";
import type { TypeSharedSchema } from "@/types/validation";

const nameSchema = z.string().min(1).max(MAX_NAME_LENGTH).regex(/\S/);
const projectIdSchema = z.int().positive();
const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const taskPrioritySchema = z.enum(["low", "normal", "high"]);
const taskDueDateSchema = z.iso.date().nullable().optional();
const taskDueAtSchema = z.iso.datetime({ offset: true }).nullable().optional();
const descriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH)
  .nullable()
  .optional();

export const projectCreateSchema = z.strictObject({
  name: nameSchema,
  description: descriptionSchema,
});
export const projectUpdateSchema = z.strictObject({
  name: nameSchema.optional(),
  description: descriptionSchema,
});
export const taskCreateSchema = z.strictObject({
  name: nameSchema,
  dueAt: taskDueAtSchema,
  status: taskStatusSchema.optional(),
  dueDate: taskDueDateSchema,
  priority: taskPrioritySchema.optional(),
  projectId: projectIdSchema,
  description: descriptionSchema,
});
export const taskUpdateSchema = z.strictObject({
  name: nameSchema.optional(),
  dueAt: taskDueAtSchema,
  status: taskStatusSchema.optional(),
  dueDate: taskDueDateSchema,
  priority: taskPrioritySchema.optional(),
  projectId: projectIdSchema.optional(),
  description: descriptionSchema,
});
export const taskReorderSchema = z.strictObject({
  projectId: projectIdSchema,
  orderedTaskIdsByStatus: z.strictObject({
    todo: z.array(projectIdSchema),
    in_progress: z.array(projectIdSchema),
    done: z.array(projectIdSchema),
  }),
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
export const taskReorderOpenApiSchema = z.toJSONSchema(
  taskReorderSchema,
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

export function normalizeDescription(
  value: string | null | undefined,
): string | null {
  const description = value?.trim();
  return description || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
