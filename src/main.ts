import { loadConfig } from "./config.ts";

async function main() {
  console.log("Starting Agent Review Handover...");
  try {
    const config = await loadConfig();
    console.log("Configuration loaded:", config);
  } catch (error) {
    console.error("Failed to load configuration:", error.message);
  }
}

if (import.meta.main) {
  main();
}
