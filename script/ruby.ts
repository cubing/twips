#!/usr/bin/env -S bun run --

import { argv, env } from "node:process";
import { styleText } from "node:util";
import { Path } from "path-class";
import { PrintableShellCommand } from "printable-shell-command";
// @ts-expect-error: Import attributes are not well-supported by the TypeScript checker.
import RUBY_VERSION from "../src/ruby-gem/.ruby-version" with { type: "text" };

const cwdPath = new Path(import.meta.resolve("../src/ruby-gem/"));

if (Path.cwd.path !== cwdPath.path) {
  // biome-ignore lint/complexity/useLiteralKeys: https://github.com/biomejs/biome/discussions/7404
  if (env["RUBY_TS_ON_CWD_MISMATCH"] !== "ignore") {
    console.info(
      `⚠️ NOTE: The current directory (${styleText(["red"], Path.cwd.path)}) will be changed to: ${styleText(["blue"], cwdPath.path)}
This will affect relative path resolution within the \`${styleText(["bold", "blue"], "ruby")}\` call.`,
    );
  }
}

new PrintableShellCommand("rv", [
  "ruby",
  "run",
  RUBY_VERSION.trim(),
  "--",
  ["-C", cwdPath],
  ...argv.slice(2),
]).shellOut();
