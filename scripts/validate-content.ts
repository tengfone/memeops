import { CATEGORY_CONFIGS, validateContent } from "./lib.ts";

const result = await validateContent();

if (result.errors.length > 0) {
  console.error("Content validation failed.\n");

  for (const error of result.errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  const total = CATEGORY_CONFIGS.reduce(
    (sum, category) => sum + result.entriesByCategory[category.id].length,
    0
  );

  console.log(
    `Validated ${total} entries across ${CATEGORY_CONFIGS.length} categories.`
  );
}
