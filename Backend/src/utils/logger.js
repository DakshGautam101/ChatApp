import { createLogger, format, transports } from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "../logs");

const customConsoleFormat = format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
  const logMessage = stack || message;
  return `${timestamp} [${level}]: ${logMessage} ${metaString}`.trim();
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customConsoleFormat
      ),
    }),
  ],
  exitOnError: false,
});

export default logger;