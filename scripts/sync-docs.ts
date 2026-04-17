import path from "node:path";
import {
  CATEGORY_CONFIGS,
  CONTENT_VERSION,
  SCHEMAS_DIR,
  buildCommonSchema,
  buildSchema,
  resetDirectory,
  writeJson
} from "./lib.ts";

await resetDirectory(SCHEMAS_DIR);

await writeJson(path.join(SCHEMAS_DIR, "common.schema.json"), buildCommonSchema());

for (const category of CATEGORY_CONFIGS) {
  await writeJson(
    path.join(SCHEMAS_DIR, `${category.id}.schema.json`),
    buildSchema(category.id)
  );
}

await writeJson(path.join(SCHEMAS_DIR, "index.json"), {
  version: CONTENT_VERSION,
  schemas: [
    {
      name: "common",
      path: "schemas/common.schema.json"
    },
    ...CATEGORY_CONFIGS.map((category) => ({
      name: category.id,
      path: `schemas/${category.id}.schema.json`
    }))
  ]
});

console.log(`Synced schema files into ${SCHEMAS_DIR}.`);
