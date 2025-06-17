const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeInternshala() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  console.log("🔍 Visiting Internshala...");
  await page.goto("https://internshala.com/internships/web-development-internship/", {
    waitUntil: "domcontentloaded"
  });

  await page.waitForSelector(".individual_internship");

  const jobs = await page.evaluate(() => {
    const cards = document.querySelectorAll(".individual_internship");
    return Array.from(cards).slice(0, 20).map(card => {
      const title = card.querySelector("h3 a")?.innerText.trim();
      const company = card.querySelector(".company_name a")?.innerText.trim();
      const location = card.querySelector(".location_link")?.innerText.trim();
      const stipend = card.querySelector(".stipend")?.innerText.trim();
      const link = "https://internshala.com" + card.querySelector("h3 a")?.getAttribute("href");

      return { platform: "Internshala", title, company, location, stipend, link };
    });
  });

  // Save all jobs (raw)
  fs.writeFileSync("internshalaJobs_RAW.json", JSON.stringify(jobs, null, 2));

  const filtered = jobs.filter(job => {
    const stipendNumbers = job.stipend?.match(/\d{4,5}/g);
    const maxStipend = stipendNumbers?.length
      ? Math.max(...stipendNumbers.map(n => parseInt(n)))
      : 0;
    return (job.location?.toLowerCase().includes("remote") || job.location) && maxStipend >= 8000;
  });

  fs.writeFileSync("internshalaJobs.json", JSON.stringify(filtered, null, 2));
  console.log(`📝 Total scraped: ${jobs.length}`);
  console.log(`✅ Saved ${filtered.length} job(s) to internshalaJobs.json`);

  await browser.close();
}

scrapeInternshala();
