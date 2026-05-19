import pino, { type LoggerOptions, type Logger as PinoLogger } from "pino";
import type { ServerConfig } from "~/config/serverConfig.server";

export type Logger = {
  fatal: PinoLogger["fatal"];
  error: PinoLogger["error"];
  warn: PinoLogger["warn"];
  info: PinoLogger["info"];
  debug: PinoLogger["debug"];
  trace: PinoLogger["trace"];
};

let logger: Logger | null = null;

/**
 * Get logger instance.
 *
 * The logger is created on the first call. Subsequent calls will return the
 * cached logger.
 */
export function getLogger(config: ServerConfig): Logger {
  if (logger === null) {
    logger = pino(getLoggerOptions(config));
  }

  return logger;
}

function getLoggerOptions(config: ServerConfig): LoggerOptions {
  const options: LoggerOptions = { level: config.log.level };

  if (["development", "test"].includes(config.environment)) {
    options.transport = {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:HH:MM:ss.l Z",
        ignore: "pid,hostname",
      },
    };
  }

  return options;
}
