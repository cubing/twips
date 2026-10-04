import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const schemaRoot = "node_modules/cubing/experimental-json-schema/kpuzzle";
const sources = ["samples", "src/lib/scramble/puzzles/definitions"];

async function jsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return jsonFiles(entryPath);
      }
      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

const files = (await Promise.all(sources.map(jsonFiles))).flat().sort();
if (files.length === 0) {
  throw new Error("No sample or puzzle definition JSON files were found.");
}

const schemas = new Map<string, string[]>();
for (const file of files) {
  const schemaName =
    file.endsWith(".def.json") || file.endsWith(".kpuzzle.json")
      ? "KPuzzleDefinition.schema.json"
      : "KPatternData.schema.json";
  const schema = path.posix.join(schemaRoot, schemaName);
  const group = schemas.get(schema) ?? [];
  group.push(file.replaceAll(path.sep, "/"));
  schemas.set(schema, group);
}

for (const [schema, dataFiles] of schemas) {
  const args = ["x", "ajv-cli@5.0.0", "validate", "-s", schema];
  for (const file of dataFiles) {
    args.push("-d", file);
  }

  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Validated ${files.length} sample and puzzle JSON files.`);
