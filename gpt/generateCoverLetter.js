import fs from "fs/promises";
import dotenv from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

dotenv.config();

const openai = new ChatOpenAI({
  temperature: 0.7,
  modelName: "gpt-4", // or "gpt-3.5-turbo" if you want to save cost
});

const resumeText = await fs.readFile("resume.txt", "utf-8");

/**
 * Generates a cover letter using GPT for a given job
 */
export async function generateCoverLetter(job) {
  const messages = [
    new SystemMessage("You are an expert assistant who writes tailored internship cover letters."),
    new HumanMessage(`
Write a short, concise, and enthusiastic cover letter tailored for the following job:

Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Job Link: ${job.link}

Here is the applicant's resume:

${resumeText}

Respond with only the cover letter.
    `),
  ];

  const response = await openai.call(messages);
  return response.text.trim();
}
