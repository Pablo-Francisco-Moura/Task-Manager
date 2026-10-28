import { Hono } from "hono";
import { sessionRoutes as authRoutes } from "./auth.routes";
import { sessionRoutes as memberRoutes } from "./members.routes";
import { sessionRoutes as workspaceRoutes } from "./workspace.routes";
import { sessionRoutes as inviteFeedRoutes } from "./invite-feed.routes";
import { sessionRoutes as inviteCreateRoutes } from "./invite-create.routes";
import { sessionRoutes as registrationRoutes } from "./registration.routes";
import { sessionRoutes as memberRemovalRoutes } from "./member-removal.routes";
import { sessionRoutes as inviteResponseRoutes } from "./invite-response.routes";
import { sessionRoutes as workspaceManagementRoutes } from "./workspace-management.routes";
import type { TypeSessionEnv } from "@/types/session";

const sessionRoutes = new Hono<TypeSessionEnv>();
sessionRoutes.route("/", authRoutes);
sessionRoutes.route("/", memberRoutes);
sessionRoutes.route("/", workspaceRoutes);
sessionRoutes.route("/", inviteFeedRoutes);
sessionRoutes.route("/", registrationRoutes);
sessionRoutes.route("/", inviteCreateRoutes);
sessionRoutes.route("/", memberRemovalRoutes);
sessionRoutes.route("/", inviteResponseRoutes);
sessionRoutes.route("/", workspaceManagementRoutes);

export { sessionRoutes };
