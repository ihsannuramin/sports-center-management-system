import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findTsxFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...findTsxFiles(fullPath));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = process.argv.length > 2 ? process.argv.slice(2) : findTsxFiles("src");
if (files.length === 0) {
  console.error("No .tsx files found");
  process.exit(1);
}

const rules = [
  // --- text-muted-foreground opacity variants (most specific first) ---
  [/\btext-muted-foreground\/50\b/g, "text-gray-300"],
  [/\btext-muted-foreground\/30\b/g, "text-gray-200"],
  [/\btext-muted-foreground\/(\d+)\b/g, "text-gray-400/$1"],
  [/\btext-muted-foreground\b/g, "text-gray-400"],

  // --- Gray: text ---
  [/\btext-on-surface\b/g, "text-gray-900"],
  [/\btext-foreground\b/g, "text-gray-700"],
  [/\btext-tertiary\b/g, "text-gray-500"],

  // --- Gray: bg ---
  [/\bbg-muted\/50\b/g, "bg-gray-50"],
  [/\bbg-muted\b/g, "bg-gray-100"],
  [/\bbg-border\b/g, "bg-gray-200"],
  [/\bbg-surface\b/g, "bg-white"],

  // --- Gray: border / misc ---
  [/\bborder-neutral\b/g, "border-gray-50"],
  [/\bborder-border\b/g, "border-gray-200"],
  [/\bborder-foreground\/20\b/g, "border-gray-300"],
  [/\bvia-surface\b/g, "via-white"],

  // --- Orange: text (negative lookahead avoids text-primary-foreground) ---
  [/\btext-primary\b(?!-)/g, "text-orange-500"],

  // --- Orange: bg (specific suffixed forms must come before bare form) ---
  [/\bbg-primary-10\b/g, "bg-orange-50"],
  [/\bbg-primary-20\b/g, "bg-orange-100"],
  [/\bbg-primary-80\b/g, "bg-orange-600"],
  [/\bbg-primary\b(?!-)/g, "bg-orange-500"],

  // --- Orange: border ---
  [/\bborder-primary-20\b/g, "border-orange-200"],
  [/\bborder-primary\b(?!-)/g, "border-orange-400"],

  // --- Orange: ring/shadow/gradient ---
  [/\bring-primary(\/\d+)?\b/g, "ring-orange-400$1"],
  [/\bshadow-primary\/20\b/g, "shadow-orange-200"],
  [/\bfrom-primary\b(?!-)/g, "from-orange-500"],
  [/\bfrom-primary-80\b/g, "from-orange-600"],
  [/\bfrom-primary-10\b/g, "from-orange-50"],
  [/\bto-primary-80\b/g, "to-orange-600"],
  [/\bto-primary\b(?!-)/g, "to-orange-500"],
  [/\bto-primary-10\b/g, "to-orange-50"],
  [/\bvia-primary-10\b/g, "via-orange-50"],

  // --- Red: text ---
  [/\btext-destructive\b/g, "text-red-500"],

  // --- Red: bg ---
  [/\bbg-destructive\/10\b/g, "bg-red-50"],
  [/\bbg-destructive\/(\d+)\b/g, "bg-red-50/$1"],

  // --- Red: border ---
  [/\bborder-destructive\/20\b/g, "border-red-100"],
];

let totalChanges = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  let out = src;
  let changes = 0;
  for (const [re, rep] of rules) {
    out = out.replace(re, (...args) => {
      changes++;
      return rep.replace(/\$1/g, args[1] ?? "");
    });
  }
  if (out !== src) {
    writeFileSync(file, out);
    console.log(`${file}: ${changes} replacements`);
    totalChanges += changes;
  }
}
console.log(`Total: ${totalChanges} replacements`);
