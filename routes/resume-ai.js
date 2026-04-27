const express = require("express");
const Resume = require("../models/resume");
const resumeAiRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const OpenAI = require("openai");

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY missing in .env");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = "nvidia/nemotron-3-super-120b-a12b:free";

const SYSTEM_PROMPT = `
You are an AI assistant that enhances resume descriptions into strong, professional bullet points.

Respond with JSON only. No prose, markdown, or backticks.

Your job:
- Improve, expand, and rewrite weak or short descriptions
- Convert them into impactful resume bullet points
- Keep the original meaning but make it more professional and results-oriented

You will receive a resume object.
Return the SAME object with ONLY these fields modified:
- "description"
- "projects[].description"
- "experience[].description"

Rules for improvement:
For "description" (top-level summary):
- Rewrite it as a professional summary (NOT bullets)
- Keep it as a single string
- 2–4 lines (concise paragraph)
- Clearly highlight role, skills, and strengths

For "projects[].description" and "experience[].description":
- Convert into 2–4 bullet points (array of strings)
- Use strong action verbs (Built, Developed, Implemented, Optimized, Designed, etc.)
- Focus on:
  - Impact
  - Results
  - Technologies used
  - Performance improvements
- Add metrics where reasonable (%, speed, users, efficiency), but do NOT hallucinate unrealistic numbers
- Make it ATS-friendly and concise

STRICT RULES:
- Do NOT modify any other fields (title, skills, education, personalInfo, etc.)
- Do NOT change existing structure
- Do NOT remove fields
- Preserve array lengths and ordering for projects and experience
- Avoid buzzwords, keep it natural and specific
- If description is empty, generate bullets based on available context (title, techStack, role)
- If unsure, improve wording without adding false information

Format:

- "description": string (professional summary)
- "projects[].description": ["bullet 1", "bullet 2"]
- "experience[].description": ["bullet 1", "bullet 2"]

If experience is empty, return it as an empty array.

Output valid JSON only.
`;

// API route to generate impactful points for resumes
resumeAiRouter.post(
  "/resumes/:id/generate-bullets",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const resumeId = req.params.id;

      const resume = await Resume.findOne({
        _id: resumeId,
        userId: loggedInUser._id,
      });

      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const inputData = {
        description: resume.description,
        projects: resume.projects,
        experience: resume.experience,
      };

      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify(inputData),
          },
        ],
        temperature: 0.4,
      });

      let aiResponse = completion.choices[0].message.content;

      aiResponse = aiResponse.trim();

      if (aiResponse.startsWith("```")) {
        aiResponse = aiResponse.replace(/```json|```/g, "").trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
      } catch (err) {
        return res.status(500).json({
          error: "AI returned invalid JSON",
        });
      }

      // ✅ Update ONLY descriptions

      if (parsed.description) {
        resume.description = Array.isArray(parsed.description)
          ? parsed.description.join(" ")
          : parsed.description;
      }

      if (parsed.projects) {
        resume.projects = resume.projects.map((proj, i) => ({
          ...proj.toObject(),
          description: parsed.projects[i]?.description || proj.description,
        }));
      }

      if (parsed.experience) {
        resume.experience = resume.experience.map((exp, i) => ({
          ...exp.toObject(),
          description: parsed.experience[i]?.description || exp.description,
        }));
      }

      await resume.save();

      res.json({
        message: "Descriptions improved successfully 🚀",
        resume,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
);

resumeAiRouter.post("/improve-description", userAuth, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description required" });
    }
    const prompt = `
You are a resume editor. Rewrite the input into a concise professional summary.

STRICT RULES (you MUST follow all):
- Maximum 2 sentences only. Never write 3 or more.
- Maximum 50 words total. Count carefully.
- No filler phrases like "Adept at", "skilled at leveraging", "cutting-edge"
- No bullet points, no markdown
- Output ONLY the rewritten text, nothing else

Input: ${description}

Rewritten (2 sentences, max 50 words):`;

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const improved = completion.choices[0].message.content.trim();

    res.json({ description: improved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

resumeAiRouter.post("/improve-project", userAuth, async (req, res) => {
  try {
    const { title = "", description } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required!" });
    }

    const prompt = `
Improve this project description into 2–4 strong resume bullet points.

Rules:
- Use action verbs
- Mention tech stack
- Be concise
- No fake metrics

Return JSON:
{
  "description": ["point1", "point2"]
}

Respond ONLY with valid JSON. No markdown, no explanation, no backticks.

Input:

Description: ${description}
`;

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    let output = completion.choices[0].message.content.trim();

    if (output.startsWith("```")) {
      output = output.replace(/```json|```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    res.json({ description: parsed.description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

resumeAiRouter.post("/improve-experience", userAuth, async (req, res) => {
  try {
    const { company = "", role = "", description } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required!" });
    }

    const prompt = `
Improve this work experience into 2–4 strong resume bullet points.

Rules:
- Use action verbs
- Focus on impact
- Keep it concise
- No fake numbers


Return JSON:
{
  "description": ["point1", "point2"]
}

Respond ONLY with valid JSON. No markdown, no explanation, no backticks.

Input:

Description: ${description}
`;

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    let output = completion.choices[0].message.content.trim();

    if (output.startsWith("```")) {
      output = output.replace(/```json|```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    res.json({ description: parsed.description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = resumeAiRouter;
