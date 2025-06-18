require("dotenv").config();
const fs = require("fs");
const axios = require("axios");

const resumeInfo = {
  name: "Ishav Manav",
  university: "DTU (Delhi Technological University)",
  highlights: `
MERN stack developer with AI and Web3 experience.
Projects: YouTube Feed Detoxifier, Solana Wallet Adapter DApp.
Contributor to Bmsamay.com.
Stack: React, Next.js, Node.js, MongoDB, Tailwind, TypeScript, C++.
  `.trim(),
};

const jobs = JSON.parse(fs.readFileSync("all_jobs_combined.json", "utf-8"));
const results = [];

function sanitize(text, fallback) {
  if (!text) return fallback;
  return text.split("\n")[0].trim();
}

async function generateLetter(job) {
  const jobTitle = sanitize(job.title, "Intern");
  const company = sanitize(job.company, job.platform || "the company");
  const platform = sanitize(job.platform, "a job platform");
  const location = sanitize(job.location, "Remote");

  const prompt = `
Write a short, personalized cover letter for ${resumeInfo.name}, a student at ${resumeInfo.university}, applying for the "${jobTitle}" internship at "${company}" via ${platform}.
Location: ${location}.

Include these:
- MERN stack with AI/Web3
- Projects: YouTube Feed Detoxifier, Solana Wallet Adapter
- Contributor to Bmsamay.com
- Keep it short (max 6 sentences), enthusiastic, professional
`;

  const res = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional assistant that writes strong internship cover letters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://yourproject.com",
        "X-Title": "Internship Cover Letter Agent",
      },
    }
  );

  return {
    ...job,
    title: jobTitle,
    company: company,
    platform,
    coverLetter: res.data.choices[0].message.content.trim(),
  };
}

(async () => {
  console.log(`✍ Generating ${jobs.length} cover letters using OpenRouter...`);

  for (let i = 0; i < jobs.length; i++) {
    try {
      const job = await generateLetter(jobs[i]);
      results.push(job);
      console.log(`✅ ${i + 1}/${jobs.length}: ${job.title} at ${job.company}`);
    } catch (err) {
      console.error(`❌ ${jobs[i].title || "Untitled"} failed: ${err.message}`);
    }
  }

  fs.writeFileSync("cover_letters.json", JSON.stringify(results, null, 2));
  console.log("📄 All letters saved to cover_letters.json");
})();
