const fs = require("fs");
const pdfParse = require("pdf-parse");

async function parseResume() {
  const buffer = fs.readFileSync("./resume.pdf");
  const data = await pdfParse(buffer);
  const text = data.text;

  const profile = {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: extractSkills(text),
    education: extractEducation(text),
    experience: extractExperience(text),
    resumeText: text
  };

  fs.writeFileSync("parsedProfile.json", JSON.stringify(profile, null, 2));
  console.log("✅ Parsed data saved to parsedProfile.json");
}

// === Helper Functions ===

function extractName(text) {
  // Heuristic: first non-empty line
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return lines[1]?.includes("Ishav") ? lines[1] : lines[0];
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const match = text.match(/(?:\+91[-\s]?)?[789]\d{9}/);
  return match ? match[0] : "";
}

function extractSkills(text) {
  const techMatch = text.match(/Languages:[\s\S]{1,300}/i);
  if (!techMatch) return [];
  return techMatch[0]
    .split(/[:,\n]/)
    .flatMap(line => line.split(/[,•\-]/))
    .map(s => s.trim())
    .filter(s => s && !s.toLowerCase().includes("languages") && s.length < 30);
}

function extractEducation(text) {
  const eduSection = text.match(/Education[\s\S]{0,400}/i);
  return eduSection ? eduSection[0].split("\n").map(l => l.trim()).filter(Boolean) : [];
}

function extractExperience(text) {
  const projMatch = text.match(/Projects[\s\S]{0,1500}/i);
  return projMatch ? projMatch[0].split("\n").map(l => l.trim()).filter(Boolean) : [];
}

parseResume();
