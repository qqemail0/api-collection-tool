import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function read(file) {
  return fs.readFile(path.join(root, file), "utf8");
}

const required = [
  "package.json",
  ".github/workflows/deploy-pages.yml",
  "scripts/build-data.mjs",
  "public/index.html",
  "public/.nojekyll",
  "public/assets/app.js",
  "public/assets/styles.css",
  "public/data/apis.json"
];

for (const file of required) {
  await fs.access(path.join(root, file));
}

const data = JSON.parse(await read("public/data/apis.json"));
const app = await read("public/assets/app.js");
const html = await read("public/index.html");
const css = await read("public/assets/styles.css");
const workflow = await read(".github/workflows/deploy-pages.yml");
const readme = await read("README.md");
const buildScript = await read("scripts/build-data.mjs");
const serializedData = JSON.stringify(data);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const privatePathMarkers = [
  ["C:", "\\", "Users", "\\"].join(""),
  ["M:", "\\"].join(""),
  ["Users", "/", "mo"].join(""),
  ["Users", "\\", "mo"].join(""),
  ["test", "chatcpt"].join(""),
  ["Downloads", "\\", ["public", "-", "apis", "-", "master"].join("")].join("")
].map(escapeRegExp);
const privatePathPattern = new RegExp(privatePathMarkers.join("|"), "i");

const sample = data.apis[0];
const checks = [
  [data.totals.apis > 1000, "expected more than 1000 APIs"],
  [data.totals.categories > 40, "expected more than 40 categories"],
  [sample.purpose && sample.purpose.includes("用于"), "API detail must include purpose"],
  [Array.isArray(sample.usage) && sample.usage.length >= 5, "API detail must include usage steps"],
  [sample.sampleRequest && sample.sampleRequest.includes("curl"), "API detail must include request sample"],
  [app.includes("filteredApis"), "frontend must implement search/filter"],
  [app.includes("renderCategories"), "frontend must render categories"],
  [app.includes("renderDetail"), "frontend must render API details"],
  [html.includes("API合集工具"), "HTML must include product name"],
  [html.includes("https://github.com/qqemail0/api-collection-tool"), "HTML must include open source repository link"],
  [html.includes("repo-orb"), "HTML must include top-right circular repository link"],
  [html.includes("source-footer-link"), "HTML must include styled footer repository button"],
  [readme.includes("https://qqemail0.github.io/api-collection-tool/"), "README must declare deployed GitHub Pages URL"],
  [!privatePathPattern.test(readme), "README must not expose local host paths"],
  [!privatePathPattern.test(buildScript), "build script must not expose local host paths"],
  [!privatePathPattern.test(serializedData), "generated data must not expose local host paths"],
  [css.includes("--teal") && css.includes("--red") && css.includes("--gold"), "CSS must use a varied palette"],
  [workflow.includes("actions/deploy-pages"), "workflow must deploy to GitHub Pages"],
  [workflow.includes("npm run build"), "workflow must rebuild API data before deploy"]
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

console.log(`OK: verified ${data.totals.apis} APIs across ${data.totals.categories} categories.`);
