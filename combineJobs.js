const fs = require("fs");

const linkedInJobsRaw = JSON.parse(fs.readFileSync("linkedin_jobs.json", "utf-8") || "[]");
const internshalaJobsRaw = JSON.parse(fs.readFileSync("internshalaJobs.json", "utf-8") || "[]");

const linkedInJobs = linkedInJobsRaw.map((job) => ({
  ...job,
  platform: "LinkedIn",
}));

const internshalaJobs = internshalaJobsRaw.map((job) => ({
  ...job,
  platform: "Internshala",
}));

const combined = [...linkedInJobs, ...internshalaJobs];

const uniqueJobs = Array.from(
  new Map(combined.map((job) => [`${job.title}_${job.company}`, job])).values()
);

fs.writeFileSync("all_jobs_combined.json", JSON.stringify(uniqueJobs, null, 2));
console.log(`✅ Combined ${uniqueJobs.length} unique jobs into all_jobs_combined.json`);
