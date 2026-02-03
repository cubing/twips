import { checkAllowedImports } from "@cubing/dev-config/check-allowed-imports";

await checkAllowedImports(
  {
    ".config": {
      entryPoints: ["./script/check-engine-versions.ts"],
      allowedImports: {
        "script/check-engine-versions.ts": {
          static: ["bun", "node:fs/promises", "node:process"],
        },
      },
    },
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
            "node:process",
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
          static: ["node:fs/promises", "node:process", "bun"],
        },
        "script/check-import-restrictions.ts": {
          static: ["@cubing/dev-config"],
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
      loader: { ".wasm": "binary" },
    },
  },
);

console.log("No disallowed imports in the project! 🥳");
