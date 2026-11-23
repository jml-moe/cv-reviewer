import { Pipeline } from "@anvia/core/pipeline";
import z from "zod";
import { CvSchema } from "./01-cv-extract";
import {
  BACKGROUND_INSTRUCTION,
  EXPERIENCE_INSTRUCTION,
  SKILLS_INSTRUCTION,
} from "./instructions";
import { askAiJson } from "./shared";

export const WEIGHTS = { skills: 0.4, experience: 0.4, background: 0.2 };

const ReviewInputSchema = z.object({
  cv: CvSchema,
  cvText: z.string(),
  position: z.string().min(1),
});
const AspectSchema = z.object({
  score: z.number().min(0).max(100),
  note: z.string().describe("Reason for the score, max 2 sentences"),
});

export const cvReview = new Pipeline({ id: "cv-review", inputSchema: ReviewInputSchema })
  .parallel({
    id: "assess-aspects",
    branches: {
      skills: new Pipeline({
        id: "skills-aspect",
        inputSchema: ReviewInputSchema,
      }).step({
        id: "assess",
        run: async ({ input }) => {
          const result = await askAiJson(
            `Position: ${input.position}\n\nCV:\n${input.cvText}`,
            AspectSchema,
            SKILLS_INSTRUCTION,
          );
          return AspectSchema.parse(result.output);
        },
      }),
      experience: new Pipeline({
        id: "experience-aspect",
        inputSchema: ReviewInputSchema,
      }).step({
        id: "assess",
        run: async ({ input }) => {
          const result = await askAiJson(
            `Position: ${input.position}\n\nCV:\n${input.cvText}`,
            AspectSchema,
            EXPERIENCE_INSTRUCTION,
          );
          return AspectSchema.parse(result.output);
        },
      }),
      background: new Pipeline({
        id: "background-aspect",
        inputSchema: ReviewInputSchema,
      }).step({
        id: "assess",
        run: async ({ input }) => {
          const result = await askAiJson(
            `Position: ${input.position}\n\nCV:\n${input.cvText}`,
            AspectSchema,
            BACKGROUND_INSTRUCTION,
          );
          return AspectSchema.parse(result.output);
        },
      }),
    },
  })
  .step({
    id: "score",
    run: ({ input }) => {
      const score = Math.round(
        input.skills.score * WEIGHTS.skills +
          input.experience.score * WEIGHTS.experience +
          input.background.score * WEIGHTS.background,
      );
      return {
        score,
        breakdown: {
          skills: input.skills.score,
          experience: input.experience.score,
          background: input.background.score,
        },
        summary: [input.skills.note, input.experience.note, input.background.note].join(" "),
      };
    },
  });
