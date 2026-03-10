import { MergeStrategy } from "./types/mod.ts";

export interface RunConfig {
  org: string;
  labels: {
    optIn: string;
    analyzed: string;
    monitoring: string;
  };
  timeouts: {
    nit: number; // in minutes
    conflict: number; // in minutes
  };
  mergeStrategy: MergeStrategy;
}

export async function loadConfig(configPath = "config.json"): Promise<RunConfig> {
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content) as RunConfig;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Configuration file not found at ${configPath}`);
    }
    throw error;
  }
}
