import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MODES = ["lite", "full", "ultra"];

const SKILL_PATH = path.join(__dirname, "..", "skills", "ponytail", "SKILL.md");

export function resolveMode(requested) {
  if (requested && MODES.includes(requested)) return requested;
  return "full";
}

export function buildInstructions(requested) {
  const mode = resolveMode(requested);
  let skill = "";
  try { skill = fs.readFileSync(SKILL_PATH, "utf8"); } catch { skill = ""; }
  return skill || "Ponytail: lazy senior dev mode. Stop at the first rung that holds.";
}
