#!/usr/bin/env -S bun run --

import assert from "node:assert";
import { env } from "node:process";
import { $ } from "bun";
import { Path } from "path-class";

const { SHELL } = env;
assert(SHELL);

await $`rv shell init ${new Path(SHELL).basename}`;
