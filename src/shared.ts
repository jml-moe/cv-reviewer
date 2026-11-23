import { generateCompletion, streamCompletion, type ZodSchema } from "@anvia/core";
import { OpenAIClient } from "@anvia/openai";

const baseUrl = Bun.env.OPENAI_BASE_URL;
const apiKey = Bun.env.OPENAI_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("baseURL and apiKey are empty");
}

const client = new OpenAIClient({ baseUrl, apiKey });
export const model = client.completionModel({ modelId: "gpt-6-luna", api: "chat" });

export function askAi(prompt: string, instructions?: string) {
  return generateCompletion({
    model,
    instructions: instructions || "You are a helpful assistant",
    prompt,
  });
}

export function askAiJson(
  prompt: string,
  outputSchema: ZodSchema,
  instructions?: string,
) {
  return generateCompletion({
    model,
    instructions: instructions || "You are a helpful assistant",
    prompt,
    outputSchema,
  });
}

export function askAiStream(prompt: string, instructions?: string) {
  return streamCompletion({
    model,
    instructions: instructions || "You are a helpful assistant",
    prompt,
  });
}
