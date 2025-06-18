const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeInternshala() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  console.log("🔍 Visiting Internshala...");
  await page.goto("https://internshala.com/internships/web-development-internship/", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(".individual_internship");

  const jobs = await page.evaluate(() => {
    const cards = document.querySelectorAll(".individual_internship");

    return Array.from(cards).map((card) => {
      const title = card.querySelector("h3 a")?.innerText.trim();
      const company = card.querySelector(".company_name a")?.innerText.trim();
      const location = card.querySelector(".location_link")?.innerText.trim();
      const stipend = card.querySelector(".stipend")?.innerText.trim();
      const link = "https://internshala.com" + card.querySelector("h3 a")?.getAttribute("href");

      return {
        platform: "Internshala",
        title,
        company,
        location,
        stipend,
        link,
      };
    });
  });

  // Save all jobs to both files
  fs.writeFileSync("internshalaJobs_RAW.json", JSON.stringify(jobs, null, 2));
  fs.writeFileSync("internshalaJobs.json", JSON.stringify(jobs, null, 2));

  console.log(`✅ Scraped and saved ${jobs.length} jobs to internshalaJobs.json`);
  await browser.close();
}

scrapeInternshala();
