const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  console.log("➡ Opening Internshala login...");
  await page.goto("https://internshala.com/login", { waitUntil: "domcontentloaded" });

  console.log("⏳ Please log in manually and solve any captcha (45s wait)...");
  await new Promise(resolve => setTimeout(resolve, 45000)); // manual login wait

  const cookies = await page.cookies();
  fs.writeFileSync("internshala_cookies.json", JSON.stringify(cookies, null, 2));
  console.log("✅ Cookies saved to internshala_cookies.json");

  await browser.close();
})();
