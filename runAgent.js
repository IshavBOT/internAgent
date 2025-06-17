import fs from "fs/promises";
import path from "path";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { SystemMessage, HumanMessage } from "langchain/schema";
import dotenv from "dotenv";
dotenv.config();

const resume = await fs.readFile("resume.txt", "utf-8");
const jobsAppliedPath = "jobs_applied.json";
let applied = [];

try {
  applied = JSON.parse(await fs.readFile(jobsAppliedPath, "utf-8"));
} catch {
  await fs.writeFile(jobsAppliedPath, "[]");
}

const openai = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.7 });

async function generateCoverLetter(job) {
  const messages = [
    new SystemMessage("You are an expert in writing concise, targeted cover letters for internships."),
    new HumanMessage(`Write a short, tailored cover letter for this role:

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Link: ${job.link}

My resume:
${resume}`),
  ];
  const response = await openai.call(messages);
  return response.text.trim();
}

async function applyToJob(job, platform) {
  // Prevent duplicates
  if (applied.find((j) => j.link === job.link)) {
    return console.log(`⏭️ Already applied: ${job.title} at ${job.company}`);
  }

  console.log(`📄 Generating cover letter for: ${job.title} at ${job.company}`);
  const letter = await generateCoverLetter(job);

  // Simulated Apply: in real bot you'd open puppeteer here
  console.log(`✅ [SIMULATED] Applied to ${job.title} at ${job.company} on ${platform}`);

  applied.push({
    title: job.title,
    company: job.company,
    platform,
    link: job.link,
    appliedAt: new Date().toISOString(),
  });

  await fs.writeFile(`cover_letters/${sanitizeFileName(job.title)}.txt`, letter);
  await fs.writeFile(jobsAppliedPath, JSON.stringify(applied, null, 2));
}

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, "-").substring(0, 50);
}

async function runBot() {
  const linkedinJobs = JSON.parse(await fs.readFile("linkedin_jobs.json", "utf-8"));
  const internshalaJobs = JSON.parse(await fs.readFile("internshalaJobs.json", "utf-8"));

  const allJobs = [
    ...linkedinJobs.map((j) => ({ ...j, platform: "LinkedIn" })),
    ...internshalaJobs.map((j) => ({ ...j, platform: "Internshala" })),
  ];

  for (const job of allJobs) {
    try {
      await applyToJob(job, job.platform);
    } catch (e) {
      console.log(`❌ Error applying to ${job.title}:`, e.message);
    }
  }

  console.log("🎉 All jobs processed.");
}

runBot();
