import morgan from "morgan";
import { getLogger } from "../utils/logger";

const logger = getLogger();

const stream = {
  write(message: string): void {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan("combined", { stream });


