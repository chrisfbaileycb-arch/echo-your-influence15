import * as logfire from "@pydantic/logfire-node";

let isConfigured = false;

export function getLogfire() {
  if (!isConfigured) {
    try {
      logfire.configure({
        serviceName: process.env.LOGFIRE_SERVICE_NAME || "starter-project",
        environment: process.env.NODE_ENV || "development",
        sendToLogfire: "if-token-present",
        token: process.env.LOGFIRE_TOKEN,
        console: process.env.NODE_ENV === "development" ? { format: "terminal" } : false,
      });
      isConfigured = true;
    } catch (err) {
      console.warn("Could not configure Logfire SDK:", err);
    }
  }
  return logfire;
}

export { logfire };
