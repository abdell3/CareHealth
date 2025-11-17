import { createLogger, format, transports, Logger } from "winston";
import path from "path";
import fs from "fs";

let loggerInstance: Logger | null = null;

const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export function getLogger(): Logger {
  if (loggerInstance) {
    return loggerInstance;
  }

  loggerInstance = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: path.join(logsDir, "app.log") }),
    ],
  });

  return loggerInstance;
}


