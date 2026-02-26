import { checkAllowedImports } from "@cubing/dev-config/check-allowed-imports";

await checkAllowedImports(
  {
    script: {
      entryPoints: ["./script/**/*.ts"],
      allowedImports: {
        script: {
          static: [
            "@cubing/dev-config",
            "@optique/core",
            "@optique/run",
            "bun:test",
            "bun",
            "cubing",
            "esbuild",
            "node:assert",
            "node:fs/promises",
            "node:os",
            "node:process",
            "node:stream",
            "node:util",
            "path-class",
            "printable-shell-command",
          ],
        },
        "script/test-dist-wasm.wasm.test.ts": {
          static: ["dist"],
        },
        dist: {
          static: ["cubing"],
        },
        "script/check-engine-versions.ts": {
          static: [
            "node:fs/promises",
            "node:process",
            "node:os",
            "bun",
            "../package.json",
          ],
        },
        "script/check-import-restrictions.ts": {
          static: ["@cubing/dev-config"],
        },
        "script/ruby.ts": {
          static: ["src/ruby-gem/.ruby-version"],
        },
      },
    },
    src: {
      entryPoints: ["./src/**/*.ts"],
      allowedImports: {
        ".temp/rust-wasm": {
          static: [
            "<runtime>", // TODO
          ],
        },
        src: {
          static: ["cubing"],
        },
        "src/ffi/test": {
          static: ["bun:ffi", "node:assert"],
        },
        "src/wasm-package/index.ts": {
          static: [".temp/rust-wasm"],
          dynamic: [".temp/rust-wasm"],
        },
      },
    },
  },
  {
    overrideEsbuildOptions: {
      loader: {
        ".wasm": "binary",
        // TODO: This should be enabled by configuring support for import assertions instead.
        ".ruby-version": "copy",
      },
      external: ["../package.json"],
      // TODO: this doesn't work.
      // supported: { "import-assertions": true },
    },
  },
);

console.log("No disallowed imports in the project! 🥳");
