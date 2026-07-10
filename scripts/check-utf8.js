// UTF-8 / mojibake guard. Run: node scripts/check-utf8.js
// Scans all .js/.html/.json (except vendor/) for invalid UTF-8 or stray
// U+FFFD replacement characters. Exits non-zero on any finding.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["vendor", "node_modules", ".git", "scripts"]);
const EXT = new Set([".js", ".html", ".json"]);
const REPLACE = Buffer.from([0xef, 0xbf, 0xbd]); // U+FFFD

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(name))) out.push(full);
  }
}

const files = [];
walk(ROOT, files);

let bad = false;
for (const file of files) {
  const buf = fs.readFileSync(file);
  let invalid = false;
  try {
    buf.toString("utf8");
    buf.toString("latin1"); // noop; real check below
    // Verify round-trip: valid UTF-8 re-encodes to the same bytes.
    if (Buffer.from(buf.toString("utf8"), "utf8").equals(buf) === false) invalid = true;
  } catch (_) {
    invalid = true;
  }
  const rel = path.relative(ROOT, file);
  if (invalid) {
    bad = true;
    console.error(`INVALID UTF-8: ${rel}`);
    continue;
  }
  const count = (() => {
    let n = 0, i = 0;
    while (i <= buf.length - 3) {
      if (buf[i] === REPLACE[0] && buf[i + 1] === REPLACE[1] && buf[i + 2] === REPLACE[2]) {
        n++; i += 3;
      } else { i++; }
    }
    return n;
  })();
  if (count > 0) {
    bad = true;
    console.error(`MOJIBAKE (U+FFFD x${count}): ${rel}`);
  }
}

if (!bad) console.log(`OK: ${files.length} files are clean UTF-8, no replacement chars.`);
process.exit(bad ? 1 : 0);
