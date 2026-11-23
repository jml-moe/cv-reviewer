import { Pipeline } from "@anvia/core/pipeline";
import z from "zod";
import { EXTRACT_INSTRUCTION } from "./instructions";
import { model } from "./shared";

export const CvSchema = z.object({
  name: z.string().describe("Candidate name"),
  skills: z.array(z.string()).describe("List of technical skills"),
  yearsExperience: z.number().describe("Total years of work experience"),
  education: z.string().describe("Latest education"),
});

const CvInputSchema = z.object({ cvText: z.string().min(20) });

export const cvExtract = new Pipeline({ id: "cv-extract", inputSchema: CvInputSchema })
  .extract({
    id: "extract",
    model,
    outputSchema: CvSchema,
    instructions: EXTRACT_INSTRUCTION,
    text: ({ input }) => input.cvText,
  })
  .step({
    id: "validate",
    run: ({ input }) => {
      return { cv: input, complete: input.name !== "" && input.skills.length > 0 };
    },
  });
