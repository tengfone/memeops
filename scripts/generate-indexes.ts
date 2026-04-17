import path from "node:path";
import {
  API_DIR,
  API_VERSION,
  CATEGORY_CONFIGS,
  CONTENT_VERSION,
  PUBLIC_API_URL,
  PUBLIC_SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  getAllFields,
  getIsoTimestamp,
  getLocalApiPath,
  getPublicApiPath,
  resetDirectory,
  validateContent,
  writeJson
} from "./lib.ts";

const result = await validateContent();

if (result.errors.length > 0) {
  console.error("Refusing to generate API outputs because validation failed.\n");

  for (const error of result.errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

const apiRootDir = path.resolve(API_DIR, "..");

await resetDirectory(apiRootDir);

const generatedAt = getIsoTimestamp();
const allEntries = CATEGORY_CONFIGS.flatMap((category) =>
  result.entriesByCategory[category.id].map((entry) => ({
    ...entry,
    category_title: category.title,
    collection_path: getLocalApiPath(category.id),
    collection_url: getPublicApiPath(category.id)
  }))
);

for (const category of CATEGORY_CONFIGS) {
  const entries = result.entriesByCategory[category.id];

  await writeJson(path.join(API_DIR, category.id), {
    category: category.id,
    title: category.title,
    summary: category.summary,
    tone: category.tone,
    count: entries.length,
    version: CONTENT_VERSION,
    generated_at: generatedAt,
    path: getLocalApiPath(category.id),
    public_url: getPublicApiPath(category.id),
    schema: `schemas/${category.id}.schema.json`,
    fields: getAllFields(category.id),
    notes: category.docsNotes,
    items: entries
  });
}

const featuredItems = CATEGORY_CONFIGS.flatMap((category) => {
  const categoryEntries = result.entriesByCategory[category.id];
  const match =
    categoryEntries.find((entry) => entry.id === category.sampleId) ?? categoryEntries[0];

  return match
    ? [
        {
          ...match,
          category_title: category.title,
          collection_path: getLocalApiPath(category.id),
          collection_url: getPublicApiPath(category.id)
        }
      ]
    : [];
});

await writeJson(path.join(API_DIR, "featured.json"), {
  version: CONTENT_VERSION,
  generated_at: generatedAt,
  items: featuredItems
});

const randomItem = allEntries[Math.floor(Math.random() * allEntries.length)];

await writeJson(path.join(API_DIR, "random"), {
  object: "random_sample",
  version: CONTENT_VERSION,
  generated_at: generatedAt,
  path: getLocalApiPath("random"),
  public_url: getPublicApiPath("random"),
  note:
    "This is a build-time random snapshot. For client-side randomness, sample from the category collection endpoints.",
  total_available: allEntries.length,
  item: randomItem
});

await writeJson(path.join(API_DIR, "index.json"), {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  site_url: PUBLIC_SITE_URL,
  public_api_url: PUBLIC_API_URL,
  api_version: API_VERSION,
  content_version: CONTENT_VERSION,
  generated_at: generatedAt,
  categories: CATEGORY_CONFIGS.map((category) => ({
    id: category.id,
    title: category.title,
    summary: category.summary,
    tone: category.tone,
    icon: category.icon,
    accent: category.accent,
    count: result.entriesByCategory[category.id].length,
    sample_id: category.sampleId,
    path: getLocalApiPath(category.id),
    public_url: getPublicApiPath(category.id),
    schema: `schemas/${category.id}.schema.json`,
    notes: category.docsNotes,
    fields: getAllFields(category.id)
  }))
});

console.log(`Generated static API output in ${API_DIR}.`);
