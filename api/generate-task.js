import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config({
  path: ".env.local",
});

const MODEL = "openai/gpt-oss-20b";

const responseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    priority: {
      type: "string",
      enum: ["Low", "Medium", "High", "Critical"],
    },
    estimatedDays: {
      type: "integer",
    },
    skills: {
      type: "array",
      items: {
        type: "string",
      },
    },
    acceptanceCriteria: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "title",
    "description",
    "priority",
    "estimatedDays",
    "skills",
    "acceptanceCriteria",
  ],
  additionalProperties: false,
};

function getErrorMessage(error) {
  return (
    error?.message ||
    error?.error?.message ||
    String(error) ||
    "Unknown Groq error."
  );
}

function isRateLimitError(error) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("quota")
  );
}

function isTemporaryServerError(error) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded")
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const {
      project,
      requirements,
      difficulty,
    } = req.body || {};

    if (!project?.trim() || !requirements?.trim()) {
      return res.status(400).json({
        error: "Project and requirements are required.",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Groq API key is not configured.",
      });
    }

    const groq = new Groq({
      apiKey,
    });

    const prompt = `
Generate one clear and realistic development task for an intern.

Project:
${project}

Requirements:
${requirements}

Difficulty:
${difficulty || "Medium"}

Rules:
- Make the title short and specific.
- Give a clear and practical description.
- Select exactly one priority from Low, Medium, High, or Critical.
- Estimate the number of days required as an integer.
- List the important technical skills required.
- Give clear and testable acceptance criteria.
- Keep the task realistic for the specified difficulty.
- The task should be suitable for an intern.
`;

    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `Generating AI task using ${MODEL}, attempt ${attempt}`
        );

        const response = await groq.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are an AI task generation assistant for an intern management platform. Generate practical software development tasks from project requirements.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "intern_task",
              strict: true,
              schema: responseSchema,
            },
          },
        });

        const content =
          response?.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error(
            "Groq returned an empty response."
          );
        }

        let task;

        try {
          task = JSON.parse(content);
        } catch (error) {
          console.error(
            "Groq returned invalid JSON:",
            content
          );

          throw new Error(
            "Groq returned an invalid task response."
          );
        }

        if (
          !task.title ||
          !task.description ||
          !task.priority ||
          task.estimatedDays === undefined ||
          !Array.isArray(task.skills) ||
          !Array.isArray(task.acceptanceCriteria)
        ) {
          throw new Error(
            "Groq returned an incomplete task response."
          );
        }

        return res.status(200).json(task);
      } catch (error) {
        lastError = error;

        const message = getErrorMessage(error);

        console.error(
          `Groq error on attempt ${attempt}:`,
          message
        );

        if (isRateLimitError(error)) {
          return res.status(429).json({
            error:
              "Groq API rate limit has been reached. Please try again later.",
          });
        }

        if (
          isTemporaryServerError(error) &&
          attempt === 1
        ) {
          await wait(2500);
          continue;
        }

        break;
      }
    }

    const finalMessage = getErrorMessage(lastError);

    if (isTemporaryServerError(lastError)) {
      return res.status(503).json({
        error: `Groq server error: ${finalMessage}`,
      });
    }

    return res.status(500).json({
      error: finalMessage,
    });
  } catch (error) {
    console.error(
      "AI Task Generator Error:",
      error
    );

    return res.status(500).json({
      error:
        getErrorMessage(error) ||
        "Failed to generate task.",
    });
  }
}