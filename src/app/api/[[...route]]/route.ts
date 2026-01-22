import { app } from "@/server";
import { Hono } from "hono";
import { handle } from "hono/vercel";

const hono = new Hono().basePath("/api").route("/", app);

export const GET = handle(hono);
export const POST = handle(hono);
export const PUT = handle(hono);
export const PATCH = handle(hono);
export const DELETE = handle(hono);
