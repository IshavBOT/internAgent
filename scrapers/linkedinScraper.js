const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

const COOKIES_PATH = path.resolve("linkedin_cookie.json");
const searchUrl =
  "https://www.linkedin.com/jobs/search/?keywords=web%20development%20intern&location=India&f_TPR=r604800&f_WT=2";

async function scrapeLinkedInJobs() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // change if needed
  });

  const page = await browser.newPage();

  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_PATH, "utf-8"));
    await page.setCookie(...cookies);
    console.log("➡ Logging in with cookie...");
    await page.goto("https://www.linkedin.com/feed", { waitUntil: "load", timeout: 0 });
    await page.waitForSelector("a[href*='/mynetwork/']", { timeout: 10000 });
    console.log("✅ Cookie login successful.");
  } catch (err) {
    console.log("❌ Cookie login failed. Please log in manually...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "load", timeout: 0 });
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    const newCookies = await page.cookies();
    await fs.writeFile(COOKIES_PATH, JSON.stringify(newCookies, null, 2));
    console.log("✅ New cookie saved.");
  }

  console.log("➡ Navigating to LinkedIn jobs page...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 0 });

  try {
    console.log("⏳ Waiting for job cards to load...");
    await page.waitForSelector("div.job-card-list__entity-lockup", { timeout: 60000 });
  } catch (err) {
    console.log("❌ Job cards not found. Saving HTML for debugging...");
    await fs.writeFile("linkedin_error_dump.html", await page.content());
    await browser.close();
    return;
  }

  await autoScroll(page);
  console.log("✅ Scraping job listings...");

  const jobs = await page.evaluate(() => {
    const cards = document.querySelectorAll("div.job-card-list__entity-lockup");
    const jobList = [];

    cards.forEach((card) => {
      const title = card.querySelector("a.job-card-container__link")?.innerText?.trim();
      const company = card.querySelector("div.artdeco-entity-lockup__subtitle")?.innerText?.trim();
      const location = card.querySelector("div.artdeco-entity-lockup__caption li span")?.innerText?.trim();
      const relativeLink = card.querySelector("a.job-card-container__link")?.getAttribute("href");
      const link = relativeLink ? `https://www.linkedin.com${relativeLink}` : null;

      if (title && company && link) {
        jobList.push({
          platform: "LinkedIn",
          title,
          company,
          location,
          link,
        });
      }
    });

    return jobList;
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found. Saving fallback HTML...");
    await fs.writeFile("linkedin_empty_results.html", await page.content());
  }

  await fs.writeFile("linkedin_jobs.json", JSON.stringify(jobs, null, 2));
  console.log(`✅ Scraped ${jobs.length} jobs. Data saved to linkedin_jobs.json`);

  await browser.close();
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200); // slightly faster scroll
    });
  });
}

scrapeLinkedInJobs();
