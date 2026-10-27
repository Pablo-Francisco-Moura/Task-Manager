import { spawn } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL must be set to start the Docker app.");
  process.exit(1);
}

try {
  const parsedUrl = new URL(databaseUrl);

  if (["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname)) {
    parsedUrl.hostname = "db";
    process.env.DATABASE_URL = parsedUrl.toString();
  }
} catch {
  console.error("DATABASE_URL must be a valid URL.");
  process.exit(1);
}

const processHandle = spawn("npm", ["run", "dev:docker:server"], {
  stdio: "inherit",
  env: process.env,
});

processHandle.on("error", (error) => {
  console.error(`Failed to start the Docker app: ${error.message}`);
  process.exit(1);
});

processHandle.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
