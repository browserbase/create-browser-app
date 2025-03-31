import type { ConstructorParams, LogLine } from "@browserbasehq/stagehand";

export function generateConfig(config: ConstructorParams): string {
  return `import type { ConstructorParams } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
${
  config.modelName?.includes("aisdk") &&
  `import { AISdkClient } from "./aisdk_client.js";
import { openai } from "@ai-sdk/openai";`
}
${
  config.modelName?.includes("custom_openai") &&
  `import { CustomOpenAIClient } from "./customOpenAI_client.js";
import { OpenAI } from "openai";`
}

dotenv.config();

const StagehandConfig: ConstructorParams = {
  verbose: 1 /* Verbosity level for logging: 0 = silent, 1 = info, 2 = all */,
  domSettleTimeoutMs: 30_000 /* Timeout for DOM to settle in milliseconds */,

  // LLM configuration
  ${
    config.modelName?.includes("gpt") ||
    config.modelName?.includes("claude") ||
    config.modelName?.includes("o3")
      ? `modelName: ${JSON.stringify(
          config.modelName
        )} /* Name of the model to use */,
  modelClientOptions: {
    apiKey: ${
      config.modelName?.includes("claude")
        ? "process.env.ANTHROPIC_API_KEY"
        : "process.env.OPENAI_API_KEY"
    },
  } /* Configuration options for the model client */,`
      : ""
  }
  ${
    config.modelName?.includes("custom_openai")
      ? `llmClient: new CustomOpenAIClient({
	  modelName: "llama3.2",
	  client: new OpenAI({
		baseURL: "http://localhost:11434/v1",
		apiKey: "ollama",
      }),
  }),`
      : ""
  }
  ${
    config.modelName?.includes("aisdk")
      ? `llmClient: new AISdkClient({
    model: openai("gpt-4o-mini"),
  }),`
      : ""
  }

  // Browser configuration
  env: ${JSON.stringify(
    config.env
  )} /* Environment to run in: LOCAL or BROWSERBASE */,
  apiKey: process.env.BROWSERBASE_API_KEY /* API key for authentication */,
  projectId: process.env.BROWSERBASE_PROJECT_ID /* Project identifier */,
  browserbaseSessionID: undefined /* Session ID for resuming Browserbase sessions */,
  browserbaseSessionCreateParams: {
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      blockAds: true,
      viewport: {
        width: 1024,
        height: 768,
      },
    },
  },
  localBrowserLaunchOptions: {
    viewport: {
      width: 1024,
      height: 768,
    },
  } /* Configuration options for the local browser */,
};

export default StagehandConfig;
`;
}
