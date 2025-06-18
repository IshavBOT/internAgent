const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// Load resume PDF
const baseResumeBytes = fs.readFileSync("resume.pdf");

// Load cleaned cover letters
const coverLetters = JSON.parse(fs.readFileSync("cover_letters.json", "utf-8"));

// Output folder
const outputDir = path.join(__dirname, "output_pdfs");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Word wrap helper
function wrapText(text, maxLineLength = 80) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let word of words) {
    if ((currentLine + word).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

async function generatePDFs() {
  for (let i = 0; i < coverLetters.length; i++) {
    const job = coverLetters[i];

    // Clean title and company
    const rawTitle = job.title || `Job_${i + 1}`;
    const rawCompany = job.company || job.platform || "Unknown";

    const jobTitle = rawTitle.replace(/[\/\\:*?"<>|\n]/g, "").trim();
    const company = rawCompany.replace(/[\/\\:*?"<>|\n]/g, "").trim();

    const filename = `${jobTitle}_${company}.pdf`.replace(/\s+/g, "_");
    const outputPath = path.join(outputDir, filename);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 12;
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const lines = wrapText(job.coverLetter || "No cover letter provided.");

    for (let line of lines) {
      if (y < margin) {
        y = height - margin;
        page.drawText("...continued", {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        page = pdfDoc.addPage();
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 5;
    }

    const resumePdf = await PDFDocument.load(baseResumeBytes);
    const resumePages = await pdfDoc.copyPages(resumePdf, resumePdf.getPageIndices());
    resumePages.forEach((p) => pdfDoc.addPage(p));

    const finalPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, finalPdfBytes);
    console.log(`✅ PDF created: ${filename}`);
  }

  console.log("\n📂 All PDFs saved to /output_pdfs");
}

generatePDFs();
