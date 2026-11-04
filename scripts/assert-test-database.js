import fs from "node:fs";
import { parse } from "dotenv";

const testEnvPath = ".env.test";
if (!fs.existsSync(testEnvPath)) {
  console.error(
    "Refusing to run tests: .env.test is missing. Create it from .env.test.example.",
  );
  process.exit(1);
}

const testEnv = parse(fs.readFileSync(testEnvPath));
const testDatabaseUrl = testEnv.DATABASE_URL;
if (!testDatabaseUrl) {
  console.error("Refusing to run tests: .env.test must define DATABASE_URL.");
  process.exit(1);
}

function getDatabaseTarget(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use PostgreSQL.");
  }
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }
  return {
    host: url.hostname,
    port: url.port || "5432",
    database,
    schema: url.searchParams.get("schema") || "public",
  };
}

function isLoopbackHost(host) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
    host.toLowerCase(),
  );
}

function sameDatabaseTarget(left, right) {
  return (
    left.host === right.host &&
    left.port === right.port &&
    left.database === right.database &&
    left.schema === right.schema
  );
}

let testTarget;
try {
  testTarget = getDatabaseTarget(testDatabaseUrl);
} catch (error) {
  console.error(`Refusing to run tests: ${error.message}`);
  process.exit(1);
}

if (testTarget.database !== "test_db") {
  console.error(
    "Refusing to run tests: .env.test must point to the dedicated test_db database.",
  );
  process.exit(1);
}
if (!isLoopbackHost(testTarget.host)) {
  console.error(
    "Refusing to run tests: .env.test must point to a local PostgreSQL server.",
  );
  process.exit(1);
}

if (process.env.DATABASE_URL) {
  let effectiveTarget;
  try {
    effectiveTarget = getDatabaseTarget(process.env.DATABASE_URL);
  } catch (error) {
    console.error(`Refusing to run tests: ${error.message}`);
    process.exit(1);
  }
  if (!sameDatabaseTarget(testTarget, effectiveTarget)) {
    console.error(
      "Refusing to run tests: the inherited DATABASE_URL differs from .env.test.",
    );
    process.exit(1);
  }
}

if (fs.existsSync(".env")) {
  const developmentUrl = parse(fs.readFileSync(".env")).DATABASE_URL;
  if (developmentUrl) {
    let developmentTarget;
    try {
      developmentTarget = getDatabaseTarget(developmentUrl);
    } catch (error) {
      console.error(`Refusing to run tests: ${error.message}`);
      process.exit(1);
    }

    if (
      testTarget.database === developmentTarget.database &&
      testTarget.schema === developmentTarget.schema
    ) {
      console.error(
        "Refusing to run tests: .env.test points to the same database and schema as .env.",
      );
      process.exit(1);
    }
  }
}
