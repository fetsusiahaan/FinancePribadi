import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "..", "..", "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logsDir, "backend.log"), { flags: "a" });
const errorStream = fs.createWriteStream(path.join(logsDir, "backend-error.log"), { flags: "a" });

export function logBackend(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(`[Backend] ${message}`);
  logStream.write(logLine);
  if (isError) {
    errorStream.write(logLine);
  }
}
