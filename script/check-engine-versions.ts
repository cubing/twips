#!/usr/bin/env -S bun run --

// TOOD: remove this once https://github.com/oven-sh/bun/issues/5846 is implemented.
// TODO: turn this into a package?

import { platform } from "node:os";
import { exit } from "node:process";
import { $, semver } from "bun";
// @ts-expect-error: Recent syntax only used in a script.
import { engines } from "../package.json" with { type: "json" };

let exitCode = 0;

async function checkEngine(
  engineID: "bun" | "node",
  versionCommand: $.ShellPromise,
  options?: { trimPrefix?: string; skipForOS?: Set<string> },
) {
  if (options?.skipForOS?.has(platform())) {
    console.info(`Skipping version check for ${engineID} on ${platform()}`);
    return;
  }
  const engineRequirement = engines[engineID];

  let engineVersion: string;
  try {
    engineVersion = (await versionCommand.text()).trim();
  } catch (_) {
    console.error(`Command failed while getting version for: ${engineID}`);
    exitCode = 1;
    return;
  }
  if (options?.trimPrefix) {
    if (!engineVersion.startsWith(options.trimPrefix)) {
      throw new Error(
        "Version command output does not start with the expected prefix.",
      );
    }
    engineVersion = engineVersion.slice(options.trimPrefix.length);
  }

  if (!semver.satisfies(engineVersion, engineRequirement)) {
    console.error(
      `Current version of \`${engineID}\` does not satisfy requirement: ${engineVersion}`,
    );
    console.error(`Version of \`${engineID}\` required: ${engineRequirement}`);
    exitCode = 1;
    return;
  }
}

async function checkEngines(): Promise<void> {
  await Promise.all([
    checkEngine("bun", $`bun --version`),
    checkEngine("node", $`node --version`),
    checkEngine("rv", $`rv --version`, {
      trimPrefix: "rv ",
      skipForOS: new Set(["win32"]),
    }),
  ]);
}

await checkEngines();
exit(exitCode);
