import { cvAdvice } from "./03-cv-advice";
import { cvExtract } from "./01-cv-extract";
import { cvReview, WEIGHTS } from "./02-cv-review";
import { askAiStream } from "./shared";

const ADVICE_THRESHOLD = 75;

const [file, position] = process.argv.slice(2);

if (!file || !position) {
  console.error('Usage: bun start <file-cv.txt> "<posisi>"');
  console.error('Contoh: bun start src/sample-cv-bagus.txt "Backend Engineer"');
  process.exit(1);
}

if (!(await Bun.file(file).exists())) {
  console.error(`File tidak ditemukan: ${file}`);
  process.exit(1);
}

// INPUT
console.log("INPUT");
const cvText = await Bun.file(file).text();
console.log(`File   : ${file}\nPosisi : ${position}\n\n${cvText}`);

// PROSES
console.log("\nPROSES");
console.log("[1/3] Ekstrak data CV...");
const extracted = (await cvExtract.run({ input: { cvText } })).output;
const cv = extracted.cv;
console.log(`      ${cv.name} | ${cv.yearsExperience} th | ${cv.skills.length} skill | lengkap: ${extracted.complete}`);

console.log("[2/3] Menilai 3 aspek sekaligus, skor akhir dihitung dengan bobot...");
const review = (await cvReview.run({ input: { cv, cvText, position } })).output;

let advice = "";
if (review.score < ADVICE_THRESHOLD) {
  console.log(`[3/3] Skor < ${ADVICE_THRESHOLD}, menyusun saran perbaikan...`);
  advice = (await cvAdvice.run({ input: { position, summary: review.summary } })).output;
} else {
  console.log(`[3/3] Skor >= ${ADVICE_THRESHOLD}, saran dilewati.`);
}

// OUTPUT
console.log("\nOUTPUT");
console.log(`Skills     : ${review.breakdown.skills} (bobot ${WEIGHTS.skills})`);
console.log(`Experience : ${review.breakdown.experience} (bobot ${WEIGHTS.experience})`);
console.log(`Background : ${review.breakdown.background} (bobot ${WEIGHTS.background})`);
console.log(`SKOR AKHIR : ${review.score}/100\n`);

const events = askAiStream(
  `Score ${review.score}/100 for "${position}". Notes: ${review.summary}`,
  "Write a 2-sentence verdict for the candidate in Bahasa Indonesia. Be honest and polite.",
);
for await (const event of events) {
  if (event.type === "text_delta") {
    process.stdout.write(event.delta);
  }
}
console.log();

if (advice) console.log(`\nSaran perbaikan:\n${advice}`);
