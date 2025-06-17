const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const readline = require("readline");
const fs = require("fs");

// Use stealth plugin to evade detection
puppeteer.use(StealthPlugin());

// Function to pause until you press Enter
function waitForEnter(prompt = "👉 Press Enter after logging in manually...") {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function scrapeWellfound() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  try {
    console.log("🔐 Opening Wellfound login page...");
    await page.goto("https://wellfound.com/login", { waitUntil: "networkidle2" });

    console.log("✅ Log in manually in the browser window...");
    await waitForEnter(); // You press Enter here once logged in manually

    console.log("🔍 Navigating to jobs page...");
    await page.goto("https://wellfound.com/jobs", { waitUntil: "networkidle2" });

    // Type in job search
    await page.waitForSelector('input[placeholder="Search jobs"]');
    await page.type('input[placeholder="Search jobs"]', "web developer");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(6000);

    // Extract jobs
    const jobs = await page.evaluate(() => {
      const cards = document.querySelectorAll(".styles_component__YbWvL");
      return Array.from(cards).slice(0, 10).map(card => {
        const title = card.querySelector("h3")?.innerText || "N/A";
        const company = card.querySelector("h2")?.innerText || "N/A";
        const link = card.querySelector("a")?.href || "N/A";
        const salaryMatch = card.innerText.match(/₹[\d,]+/);
        return {
          platform: "Wellfound",
          title,
          company,
          link,
          salary: salaryMatch ? salaryMatch[0] : "Not listed",
        };
      });
    });

    fs.writeFileSync("wellfoundJobs.json", JSON.stringify(jobs, null, 2));
    console.log(`✅ Saved ${jobs.length} job(s) to wellfoundJobs.json`);

  } catch (err) {
    console.error("❌ Error occurred while scraping:", err.message);
  } finally {
    await browser.close();
  }
}

scrapeWellfound();
