import { Pipeline } from "@anvia/core/pipeline";
import z from "zod";
import { DRAFT_INSTRUCTION, EVALUATE_INSTRUCTION, REVISE_INSTRUCTION } from "./instructions";
import { askAi, askAiJson } from "./shared";

const AdviceInputSchema = z.object({ position: z.string(), summary: z.string() });
const EvaluationSchema = z.object({
  passed: z.boolean().describe("true if every advice is concrete and can be done right away"),
  feedback: z.string().describe("What to improve if not passed"),
});

export const cvAdvice = new Pipeline({ id: "cv-advice", inputSchema: AdviceInputSchema })
  .step({
    id: "draft",
    run: async ({ input }) => {
      const advice = (
        await askAi(
          `Position: ${input.position}\n\nReview: ${input.summary}`,
          DRAFT_INSTRUCTION,
        )
      ).text;
      return { advice };
    },
  })
  .step({
    id: "evaluate",
    run: async ({ input }) => {
      const result = await askAiJson(
        input.advice,
        EvaluationSchema,
        EVALUATE_INSTRUCTION,
      );
      return { advice: input.advice, ...EvaluationSchema.parse(result.output) };
    },
  })
  .step({
    id: "revise",
    run: async ({ input }) =>
      input.passed
        ? input.advice
        : (
            await askAi(
              `Feedback: ${input.feedback}\n\nTips: ${input.advice}`,
              REVISE_INSTRUCTION,
            )
          ).text,
  });
