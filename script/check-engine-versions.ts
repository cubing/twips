#!/usr/bin/env -S bun run --

// TOOD: remove this once https://github.com/oven-sh/bun/issues/5846 is implemented.
// TODO: turn this into a package?

import { exit } from "node:process";
import { $, semver } from "bun";
import { engines } from "../package.json" with { type: "json" };

let exitCode = 0;

async function checkEngine(
  engineID: "bun" | "node",
  versionCommand: $.ShellPromise,
) {
  const engineRequirement = engines[engineID];

  let engineVersion: string;
  try {
    engineVersion = (await versionCommand.text()).trim();
  } catch (_) {
    console.error(`Command failed while getting version for: ${engineID}`);
    exitCode = 1;
    return;
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
  const a = $`bun --version`;
  await Promise.all([
    checkEngine("bun", a),
    checkEngine("node", $`node --version`),
  ]);
}

await checkEngines();
exit(exitCode);
