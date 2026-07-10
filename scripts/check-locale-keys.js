// Locale key parity gate. Run: node scripts/check-locale-keys.js
// Exits non-zero if zh-CN.js and en-US.js have different key sets.
const fs = require("fs");
const path = require("path");

function readLocaleKeys(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  // Keys sit at the start of a line (with optional indent); values are inline,
  // so anchoring at line start avoids matching string values. Supports both
  // single- and double-quoted keys.
  const matches = content.match(/^\s*['"]([^'"]+)['"]\s*:/gm) || [];
  return matches.map((item) =>
    item.trim().replace(/^['"]/, "").replace(/['"]\s*:$/, "")
  );
}

function diffKeys(source, target) {
  return source.filter((key) => !target.includes(key)).sort();
}

const zhPath = path.join(__dirname, "..", "locales", "zh-CN.js");
const enPath = path.join(__dirname, "..", "locales", "en-US.js");

const zhKeys = readLocaleKeys(zhPath);
const enKeys = readLocaleKeys(enPath);

const missingInEn = diffKeys(zhKeys, enKeys);
const missingInZh = diffKeys(enKeys, zhKeys);

const dupZh = zhKeys.filter((k, i) => zhKeys.indexOf(k) !== i);
const dupEn = enKeys.filter((k, i) => enKeys.indexOf(k) !== i);

let bad = false;
if (missingInEn.length || missingInZh.length || dupZh.length || dupEn.length) {
  bad = true;
  if (missingInEn.length) {
    console.error("Missing in en-US:");
    missingInEn.forEach((key) => console.error("  - " + key));
  }
  if (missingInZh.length) {
    console.error("Missing in zh-CN:");
    missingInZh.forEach((key) => console.error("  - " + key));
  }
  if (dupZh.length) {
    console.error("Duplicate keys in zh-CN:");
    [...new Set(dupZh)].forEach((key) => console.error("  - " + key));
  }
  if (dupEn.length) {
    console.error("Duplicate keys in en-US:");
    [...new Set(dupEn)].forEach((key) => console.error("  - " + key));
  }
}

if (!bad) {
  console.log(`OK: ${zhKeys.length} keys, zh-CN and en-US are in parity.`);
} else {
  console.error(`zh-CN: ${zhKeys.length} keys, en-US: ${enKeys.length} keys.`);
}
process.exit(bad ? 1 : 0);
