import {
  getServerConfig,
  type ServerConfig,
} from "~/config/serverConfig.server";
import { getLogger, type Logger } from "~/logger";

export type ScriptContext = {
  config: ServerConfig;
  logger: Logger;
};

export async function runScript(
  script: (context: ScriptContext) => Promise<void>,
) {
  try {
    const config = getServerConfig();
    const logger = getLogger(config);

    await script({ config, logger });

    process.exit(0);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logger may not be initialized here.
    console.error(error);

    process.exit(1);
  }
}
