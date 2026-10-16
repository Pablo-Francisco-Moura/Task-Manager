import { Hono } from "hono";
import { prisma } from "@/lib/prisma";
import { TEST_GUEST_COOKIE, TEST_GUEST_IDENTITY } from "@/constants/testGuest";
import type { TypeSessionEnv } from "@/types/session";
import type { Project, Task, Prisma } from "@prisma/client";

const projectDefaults = {
  workspaceId: TEST_GUEST_IDENTITY.workspaceId,
  createdById: TEST_GUEST_IDENTITY.userId,
};
const taskDefaults = { createdById: TEST_GUEST_IDENTITY.userId };

function withCreateDefaults<T extends object>(delegate: T, defaults: object) {
  return new Proxy(delegate, {
    get(target, property) {
      if (property === "create") {
        return (args: {
          data: Record<string, unknown>;
          [key: string]: unknown;
        }) => {
          const create = Reflect.get(target, property, target) as (
            input: typeof args,
          ) => unknown;
          return create.call(target, {
            ...args,
            data: { ...defaults, ...args.data },
          });
        };
      }
      if (property === "createMany") {
        return (args: {
          data: Record<string, unknown>[];
          [key: string]: unknown;
        }) => {
          const createMany = Reflect.get(target, property, target) as (
            input: typeof args,
          ) => unknown;
          return createMany.call(target, {
            ...args,
            data: args.data.map((data) => ({ ...defaults, ...data })),
          });
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

const projectDelegate = withCreateDefaults(prisma.project, projectDefaults);
const taskDelegate = withCreateDefaults(prisma.task, taskDefaults);

type TypeTestPrisma = Omit<typeof prisma, "project" | "task"> & {
  project: Omit<typeof prisma.project, "create" | "createMany"> & {
    create(args: { data: Record<string, unknown> }): Promise<Project>;
    createMany(args: {
      data: Record<string, unknown>[];
    }): Promise<Prisma.BatchPayload>;
  };
  task: Omit<typeof prisma.task, "create" | "createMany"> & {
    create(args: { data: Record<string, unknown> }): Promise<Task>;
    createMany(args: {
      data: Record<string, unknown>[];
    }): Promise<Prisma.BatchPayload>;
  };
};

export const testPrisma = new Proxy(prisma, {
  get(target, property) {
    if (property === "project") return projectDelegate;
    if (property === "task") return taskDelegate;

    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as unknown as TypeTestPrisma;

export function createTestRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("cookie")) headers.set("cookie", TEST_GUEST_COOKIE);
  return new Request(`http://localhost${path}`, { ...init, headers });
}

export function createAuthenticatedTestApp(
  prefix: string,
  routes: Hono<TypeSessionEnv>,
) {
  const app = new Hono<TypeSessionEnv>();
  app.use("*", async (context, next) => {
    context.set("userId", TEST_GUEST_IDENTITY.userId);
    context.set("workspaceId", TEST_GUEST_IDENTITY.workspaceId);
    await next();
  });
  app.route(prefix, routes);
  return app;
}
