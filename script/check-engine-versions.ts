#!/usr/bin/env bun

// TOOD: remove this once https://github.com/oven-sh/bun/issues/5846 is implemented.
// TODO: turn this into a package?

import { readFile } from "node:fs/promises";
import { exit } from "node:process";
import { $, semver } from "bun";

const { engines } = JSON.parse(await readFile("./package.json", "utf-8"));

let exitCode = 0;

async function checkEngine(engineID: string, versionCommand: $.ShellPromise) {
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
      `Current version of \`${engineID}\` is out of date: ${engineVersion}`,
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
