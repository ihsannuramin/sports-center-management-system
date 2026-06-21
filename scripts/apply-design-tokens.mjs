import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node apply-design-tokens.mjs <file...>");
  process.exit(1);
}

// Rules: [regex, replacement]. Applied in order.
// "Adds opacity" colors (map to /NN) need a preceding rule for explicit opacity variants.
const rules = [
  // --- Gray: text ---
  [/\btext-gray-900\b/g, "text-on-surface"],
  [/\btext-gray-800\b/g, "text-on-surface"],
  [/\btext-gray-700\b/g, "text-foreground"],
  [/\btext-gray-600\b/g, "text-foreground"],
  [/\btext-gray-500\b/g, "text-tertiary"],
  [/\btext-gray-400\b/g, "text-muted-foreground"],
  [/\btext-gray-300\/(\d+)\b/g, "text-muted-foreground/$1"],
  [/\btext-gray-300\b/g, "text-muted-foreground/50"],
  [/\btext-gray-200\/(\d+)\b/g, "text-muted-foreground/$1"],
  [/\btext-gray-200\b/g, "text-muted-foreground/30"],

  // --- Gray: bg ---
  [/\bbg-gray-50\/(\d+)\b/g, "bg-muted/$1"],
  [/\bbg-gray-50\b/g, "bg-muted/50"],
  [/\bbg-gray-100\b/g, "bg-muted"],
  [/\bbg-gray-200\b/g, "bg-border"],
  [/\bbg-white\b/g, "bg-surface"],

  // --- Gray: border / misc ---
  [/\bborder-gray-50\b/g, "border-neutral"],
  [/\bborder-gray-100\b/g, "border-neutral"],
  [/\bborder-gray-200\b/g, "border-border"],
  [/\bborder-gray-300\b/g, "border-foreground/20"],
  [/\bvia-white\b/g, "via-surface"],

  // --- Orange: text ---
  [/\btext-orange-400\b/g, "text-primary"],
  [/\btext-orange-500\b/g, "text-primary"],
  [/\btext-orange-600\b/g, "text-primary"],
  [/\btext-orange-700\b/g, "text-primary"],

  // --- Orange: bg ---
  [/\bbg-orange-50\b/g, "bg-primary-10"],
  [/\bbg-orange-100\b/g, "bg-primary-20"],
  [/\bbg-orange-200\b/g, "bg-primary-20"],
  [/\bbg-orange-500\b/g, "bg-primary"],
  [/\bbg-orange-600\b/g, "bg-primary-80"],

  // --- Orange: border ---
  [/\bborder-orange-100\b/g, "border-primary-20"],
  [/\bborder-orange-200\b/g, "border-primary-20"],
  [/\bborder-orange-300\b/g, "border-primary"],
  [/\bborder-orange-400\b/g, "border-primary"],

  // --- Orange: ring/shadow/gradient ---
  [/\bring-orange-400(\/\d+)?\b/g, "ring-primary$1"],
  [/\bshadow-orange-200(?:\/\d+)?\b/g, "shadow-primary/20"],
  [/\bfrom-orange-500\b/g, "from-primary"],
  [/\bfrom-orange-600\b/g, "from-primary-80"],
  [/\bfrom-orange-50\b/g, "from-primary-10"],
  [/\bto-orange-600\b/g, "to-primary-80"],
  [/\bto-orange-500\b/g, "to-primary"],
  [/\bto-orange-50\b/g, "to-primary-10"],
  [/\bvia-orange-50\b/g, "via-primary-10"],

  // --- Red: text ---
  [/\btext-red-400\b/g, "text-destructive"],
  [/\btext-red-500\b/g, "text-destructive"],
  [/\btext-red-600\b/g, "text-destructive"],
  [/\btext-red-700\b/g, "text-destructive"],

  // --- Red: bg ---
  [/\bbg-red-50\/(\d+)\b/g, "bg-destructive/$1"],
  [/\bbg-red-50\b/g, "bg-destructive/10"],

  // --- Red: border ---
  [/\bborder-red-100\b/g, "border-destructive/20"],
  [/\bborder-red-200\b/g, "border-destructive/20"],
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
  } else {
    console.log(`${file}: no changes`);
  }
}
console.log(`Total: ${totalChanges} replacements`);
