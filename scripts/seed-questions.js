/**
 * seed-questions.js
 *
 * Reads all JSON files from prisma/questions_bank/ and upserts them into
 * the Question table. Uses a deterministic SHA-256-based ID derived from
 * the question title so the script is fully idempotent — running it twice
 * will update existing rows rather than creating duplicates.
 *
 * Usage:
 *   node scripts/seed-questions.js
 *   npm run seed:questions
 *
 * NOTE: This script does NOT wipe existing questions. It is safe to run
 * alongside seed-problems.js, but be aware that seed-problems.js DOES
 * delete all questions first (deleteMany). Run seed-questions.js AFTER
 * seed-problems.js if you use both.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();
const BANK_DIR = path.join(__dirname, "../prisma/questions_bank");

/**
 * Generate a deterministic UUID-format ID from a question title.
 * This ensures upsert by ID works consistently across runs.
 */
function titleToId(title) {
  const hash = crypto
    .createHash("sha256")
    .update(title.toLowerCase().trim())
    .digest("hex");
  // Format as xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (version 4 UUID shape)
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Build a full HTML description string from a question object.
 * Matches the style used in seed-problems.js exactly.
 */
function buildDescription(q) {
  let fullDescription = q.description + "\n\n";

  const sampleTests = q.tests.filter((t) => t.isSample);

  if (sampleTests.length > 0) {
    sampleTests.forEach((test, index) => {
      let inputStr = test.input;

      if (q.args.length > 1 && test.is_single_array_arg === false) {
        // Multi-arg: parse the outer array and label each arg
        try {
          const parsedArgs = JSON.parse(test.input);
          if (Array.isArray(parsedArgs)) {
            // Derive param names from arg type strings
            const paramNames = q.args.map((argType, i) => {
              const base = argType
                .replace(/\[\]/g, "")
                .replace(/integer/i, "nums")
                .replace(/string/i, "s")
                .replace(/boolean/i, "flag");
              // Disambiguate when multiple args share same base name
              const sameTypeBefore = q.args.slice(0, i).filter(
                (a) => a.replace(/\[\]/g, "") === argType.replace(/\[\]/g, "")
              ).length;
              return sameTypeBefore > 0 ? `${base}${sameTypeBefore + 1}` : base;
            });
            inputStr = parsedArgs
              .map((arg, i) => `${paramNames[i] || `arg${i}`} = ${JSON.stringify(arg)}`)
              .join(", ");
          }
        } catch (_) {
          // Leave inputStr as-is if parsing fails
        }
      } else if (q.args.length === 1) {
        // Single arg: label with a sensible name based on type
        const argType = q.args[0] || "";
        const paramName = argType.includes("string")
          ? "s"
          : argType.includes("integer") && argType.includes("[]")
          ? "nums"
          : argType.includes("integer")
          ? "n"
          : "input";
        inputStr = `${paramName} = ${test.input}`;
      }

      fullDescription += `<p class="font-bold text-white mt-6 mb-2">Example ${index + 1}:</p>\n`;
      fullDescription += `<div class="bg-dark-900/50 border border-white/5 rounded-xl p-4 mb-4 font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">`;
      fullDescription += `<div class="mb-1"><span class="font-bold text-brand-400">Input:</span> <span class="text-dark-200">${inputStr}</span></div>`;
      fullDescription += `<div class="mb-1"><span class="font-bold text-brand-400">Output:</span> <span class="text-green-400">${test.expected}</span></div>`;
      if (test.explanation) {
        fullDescription += `<div><span class="font-bold text-brand-400">Explanation:</span> <span class="text-dark-300 font-sans">${test.explanation}</span></div>`;
      }
      fullDescription += `</div>\n`;
    });
  }

  if (q.constraints && q.constraints.length > 0) {
    fullDescription += `<p class="font-bold text-white mt-8 mb-3">Constraints:</p>\n`;
    fullDescription += `<ul class="list-disc pl-5 space-y-2 text-dark-300">\n`;
    q.constraints.forEach((constraint) => {
      const clean = constraint.replace(/10\^(\d+)/g, "10<sup>$1</sup>");
      fullDescription += `  <li class="pl-1"><code class="bg-dark-800 px-2 py-0.5 rounded text-xs border border-white/10 text-brand-100">${clean}</code></li>\n`;
    });
    fullDescription += `</ul>\n`;
  }

  return fullDescription;
}

async function seed() {
  // Collect all JSON files in the bank directory
  if (!fs.existsSync(BANK_DIR)) {
    console.error(`Bank directory not found: ${BANK_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BANK_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("No question bank files found.");
    return;
  }

  console.log(`Found ${files.length} question bank file(s):\n`);

  let total = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(BANK_DIR, file);
    let questions;

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      questions = JSON.parse(raw);
    } catch (e) {
      console.error(`  [PARSE ERROR] ${file}: ${e.message}`);
      errors++;
      continue;
    }

    console.log(`  ${file} (${questions.length} questions)`);

    for (const q of questions) {
      if (!q.title) {
        console.error(`    [SKIP] Question missing title in ${file}`);
        errors++;
        continue;
      }

      const id = titleToId(q.title);

      // Split tests by isSample flag; strip isSample before storing
      const sampleTests = (q.tests || [])
        .filter((t) => t.isSample === true)
        .map(({ isSample, ...rest }) => rest);

      const hiddenTests = (q.tests || [])
        .filter((t) => t.isSample === false)
        .map(({ isSample, ...rest }) => rest);

      const fullDescription = buildDescription(q);

      try {
        await prisma.question.upsert({
          where: { id },
          update: {
            title: q.title,
            difficulty: q.difficulty,
            args: q.args || [],
            returnType: q.returnType || "integer",
            constraints: q.constraints || [],
            description: fullDescription,
            sampleTests,
            hiddenTests,
          },
          create: {
            id,
            title: q.title,
            difficulty: q.difficulty,
            args: q.args || [],
            returnType: q.returnType || "integer",
            constraints: q.constraints || [],
            description: fullDescription,
            sampleTests,
            hiddenTests,
          },
        });
        console.log(`    [OK] "${q.title}" (${q.difficulty}) — ${sampleTests.length} sample, ${hiddenTests.length} hidden tests`);
        total++;
      } catch (e) {
        console.error(`    [FAIL] "${q.title}": ${e.message}`);
        errors++;
      }
    }

    console.log();
  }

  console.log(`─────────────────────────────────────`);
  console.log(`Seeded ${total} question(s) with ${errors} error(s).`);

  if (errors > 0) {
    console.warn(`\nWarning: ${errors} questions failed to seed. Check errors above.`);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
