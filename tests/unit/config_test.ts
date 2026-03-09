import { assertEquals, assertRejects } from "@std/assert";
import { loadConfig } from "../../src/config.ts";

Deno.test("loadConfig - loads valid config", async () => {
  const tempFile = await Deno.makeTempFile();
  const config = {
    org: "test-org",
    labels: {
      optIn: "opt-in",
      analyzed: "analyzed",
      monitoring: "monitoring",
    },
    timeouts: {
      nit: 10,
      conflict: 20,
    },
    mergeStrategy: "merge",
  };
  await Deno.writeTextFile(tempFile, JSON.stringify(config));

  try {
    const loadedConfig = await loadConfig(tempFile);
    assertEquals(loadedConfig, config);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("loadConfig - throws if file not found", async () => {
  await assertRejects(
    () => loadConfig("non-existent.json"),
    Error,
    "Configuration file not found at non-existent.json",
  );
});
