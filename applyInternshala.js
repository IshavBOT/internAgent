const puppeteer = require("puppeteer");
const fs = require("fs");

const jobs = JSON.parse(fs.readFileSync("cover_letters.json", "utf-8")).filter(
  (job) => job.platform === "Internshala" && job.link && job.link.includes("internshala.com")
);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  const cookies = JSON.parse(fs.readFileSync("internshala_cookies.json", "utf-8"));
  await page.setCookie(...cookies);

  await page.goto("https://internshala.com", { waitUntil: "networkidle2" });
  console.log("✅ Logged in using saved cookies");

  for (let job of jobs) {
    console.log(`➡ Applying to: ${job.title} at Internshala`);

    if (!job.link || !job.link.startsWith("https://internshala.com")) {
      console.log("❌ Invalid job link. Skipping...");
      continue;
    }

    try {
      await page.goto(job.link, { waitUntil: "domcontentloaded" });
      await new Promise((res) => setTimeout(res, 2000));

      const alreadyApplied = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("button")).some((btn) =>
          btn.innerText.toLowerCase().includes("applied")
        );
      });
      if (alreadyApplied) {
        console.log("⚠️ Already applied. Skipping...");
        continue;
      }

      // Click Apply Now
      const applyNowClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const applyBtn = buttons.find((btn) =>
          btn.innerText.trim().toLowerCase().includes("apply now")
        );
        if (applyBtn) {
          applyBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          applyBtn.click();
          return true;
        }
        return false;
      });

      if (!applyNowClicked) {
        console.log("❌ Apply button not found. Skipping...");
        continue;
      }

      console.log("⏳ Apply Now clicked. Waiting for resume preview or form...");
      await new Promise((res) => setTimeout(res, 3000));

      const proceedClicked = await page.evaluate(() => {
        const walker = document.evaluate(
          "//button[contains(text(),'Proceed to application')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const btn = walker.singleNodeValue;
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (proceedClicked) {
        console.log("👉 Clicked 'Proceed to application'");
        await new Promise((res) => setTimeout(res, 2000));
      }

      // Select availability
      await page.evaluate(() => {
        const radio = document.querySelector("input[type='radio'][value='immediately']");
        if (radio) radio.click();
      });

      // Upload resume
      const fileInput = await page.$("input[type='file']");
      if (fileInput && fs.existsSync("resume.pdf")) {
        await fileInput.uploadFile("resume.pdf");
        console.log("📎 Resume uploaded");
        await new Promise((res) => setTimeout(res, 1000));
      } else {
        console.log("⚠️ Resume input not found or resume.pdf missing");
      }

      // ✅ Let user manually submit or fill custom questions
      console.log("🛑 Waiting for you to manually complete and submit the form...");
      console.log("👉 Press ENTER in the terminal once done to continue to the next internship");

      await new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.once("data", () => {
          process.stdin.pause();
          resolve();
        });
      });

    } catch (err) {
      console.log(`❌ Failed for ${job.title}: ${err.message}`);
    }

    await new Promise((res) => setTimeout(res, 2000));
  }

  console.log("\n🎯 Finished applying to Internshala jobs!");
  await browser.close();
})();
