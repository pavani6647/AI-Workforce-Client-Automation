import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

const responseSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
    },

    functionalRequirements: {
      type: "array",
      items: {
        type: "string",
      },
    },

    nonFunctionalRequirements: {
      type: "array",
      items: {
        type: "string",
      },
    },

    priorities: {
      type: "object",
      properties: {
        must: {
          type: "array",
          items: {
            type: "string",
          },
        },
        should: {
          type: "array",
          items: {
            type: "string",
          },
        },
        could: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["must", "should", "could"],
    },

    techStack: {
      type: "array",
      items: {
        type: "string",
      },
    },

    risks: {
      type: "array",
      items: {
        type: "string",
      },
    },

    suggestedTasks: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },

  required: [
    "summary",
    "functionalRequirements",
    "nonFunctionalRequirements",
    "priorities",
    "techStack",
    "risks",
    "suggestedTasks",
  ],
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured.",
      });
    }

    const { requirement } = req.body || {};

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({
        error: "Requirement is required.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an expert software requirements analyst.

Analyze the following client requirement and convert it into a structured project analysis.

CLIENT REQUIREMENT:
${requirement}

Your job is to identify:

1. A clear summary of what the client wants.
2. Functional requirements — what the system must do.
3. Non-functional requirements — quality, security, performance, scalability,
   usability, reliability and other system constraints.
4. MoSCoW priorities:
   - Must Have: essential requirements
   - Should Have: important but not absolutely essential
   - Could Have: useful optional features
5. A practical technology stack suitable for implementing the project.
6. Potential implementation risks or uncertainties.
7. Suggested implementation tasks that a development team can actually work on.

Important rules:
- Base the analysis only on the provided client requirement.
- Do not invent highly specific requirements that the client did not imply.
- If something is uncertain, express it as a reasonable assumption or risk.
- Keep every list item concise and practical.
- Suggested tasks should be actionable development tasks.
- Return only the requested structured JSON.
`;

    let lastError = null;

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        const text = response.text;

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        const analysis = JSON.parse(text);

        return res.status(200).json(analysis);
      } catch (error) {
        lastError = error;

        const status =
          error?.status ||
          error?.code ||
          error?.response?.status ||
          500;

        console.error(`Gemini model ${model} failed:`, error);

        if (status !== 429 && status !== 503) {
          break;
        }
      }
    }

    console.error("All Gemini models failed:", lastError);

    return res.status(500).json({
      error:
        lastError?.message ||
        "Unable to analyze the requirement with Gemini.",
    });
  } catch (error) {
    console.error("Requirement analyzer error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "An unexpected error occurred while analyzing the requirement.",
    });
  }
}