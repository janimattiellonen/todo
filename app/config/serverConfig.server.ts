import { requireOneOf, requireString } from "~/config/require";

const environments = ["development", "production", "test"] as const;

type Environment = (typeof environments)[number];

const logLevels = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

type LogLevel = (typeof logLevels)[number];

const emailTransports = ["mock", "resend"] as const;

type EmailTransportName = (typeof emailTransports)[number];

export type ServerConfig = {
  environment: Environment;
  log: {
    level: LogLevel;
  };
  database: {
    url: string;
  };
  email: {
    transport: EmailTransportName;
    /** Required when transport === "resend". */
    resendApiKey: string | null;
    /** Default `from` address when not provided per-message. */
    from: string;
  };
};

let serverConfig: ServerConfig | null = null;

/**
 * Get server configuration from environment variables.
 *
 * The configuration is created on the first call. This means that the first
 * call will validate the environment variables, and subsequent calls will
 * return the cached configuration.
 */
export function getServerConfig(): ServerConfig {
  if (serverConfig === null) {
    serverConfig = createServerConfig();
  }

  return serverConfig;
}

/**
 * @throws {Error} If a required environment variable is missing or invalid.
 */
function createServerConfig(): ServerConfig {
  return {
    environment: requireOneOf("NODE_ENV", environments),
    log: {
      level: requireOneOf("LOG_LEVEL", logLevels),
    },
    database: {
      url: requireString("DATABASE_URL"),
    },
    email: {
      transport: requireOneOf("EMAIL_TRANSPORT", emailTransports),
      resendApiKey: process.env["RESEND_API_KEY"] ?? null,
      from: requireString("EMAIL_FROM"),
    },
  };
}
