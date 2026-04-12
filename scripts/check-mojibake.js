#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const stagedOnly = process.argv.includes("--staged");
const textExts = new Set([".md", ".markdown", ".yml", ".yaml"]);
const defaultRoots = ["README.md", "_pages", "_posts", "_publications", "_talks", "_teaching", "_data"];
const ignoreDirs = new Set([".git", "node_modules", "vendor", "_site", "tmp"]);
const aboutPage = "_pages/about.md";
const chineseName = "\u5218\u5fd7\u5e73"; // Liu Zhi-Ping in Chinese

const suspiciousPatterns = [
  {
    regex: /\uFFFD/g,
    reason: "contains replacement character U+FFFD (usually broken decoding)"
  }
];

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function isCandidate(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!textExts.has(ext)) return false;
  const parts = toPosix(filePath).split("/");
  return !parts.some((part) => ignoreDirs.has(part));
}

function walk(entry, out) {
  if (!fs.existsSync(entry)) return;
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    if (isCandidate(entry)) out.push(entry);
    return;
  }

  const base = path.basename(entry);
  if (ignoreDirs.has(base)) return;

  for (const dirent of fs.readdirSync(entry, { withFileTypes: true })) {
    walk(path.join(entry, dirent.name), out);
  }
}

function getStagedFiles() {
  const output = cp
    .execSync("git diff --cached --name-only --diff-filter=ACMR", { encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => fs.existsSync(file))
    .filter((file) => isCandidate(file));

  return Array.from(new Set(output));
}

function getScanFiles() {
  if (stagedOnly) return getStagedFiles();

  const files = [];
  for (const root of defaultRoots) {
    walk(root, files);
  }
  return Array.from(new Set(files));
}

function findLineMatches(content, regex) {
  const matches = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    regex.lastIndex = 0;
    if (regex.test(line)) {
      matches.push({ lineNumber: i + 1, line });
    }
  }

  return matches;
}

function checkAboutPage(findings) {
  if (!fs.existsSync(aboutPage)) return;

  const content = fs.readFileSync(aboutPage, "utf8");
  const expectedSnippet = `(${chineseName}). I'm a Ph.D. student`;

  if (!content.includes(expectedSnippet)) {
    findings.push({
      file: aboutPage,
      line: 0,
      reason: "expected Chinese name snippet is missing",
      sample: expectedSnippet
    });
  }

  const introRegex = /Hi! My name is \*\*Zhi-Ping Liu\*\* \(([^)]+)\)\./;
  const introMatch = content.match(introRegex);
  if (introMatch && introMatch[1] !== chineseName) {
    findings.push({
      file: aboutPage,
      line: 0,
      reason: "name in about intro does not match expected Chinese text",
      sample: introMatch[0]
    });
  }
}

function main() {
  const files = getScanFiles();
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");

    for (const rule of suspiciousPatterns) {
      const lineMatches = findLineMatches(content, rule.regex);
      for (const hit of lineMatches) {
        findings.push({
          file,
          line: hit.lineNumber,
          reason: rule.reason,
          sample: hit.line.trim()
        });
      }
    }
  }

  checkAboutPage(findings);

  if (findings.length > 0) {
    console.error("Mojibake check failed:\n");
    for (const f of findings) {
      const location = f.line > 0 ? `${toPosix(f.file)}:${f.line}` : toPosix(f.file);
      console.error(`- ${location} -> ${f.reason}`);
      console.error(`  ${f.sample}`);
    }
    process.exit(1);
  }

  const scope = stagedOnly ? "staged files" : "repository content";
  console.log(`Mojibake check passed for ${scope}.`);
}

main();