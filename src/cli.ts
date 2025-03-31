#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import { ConstructorParams } from "@browserbasehq/stagehand";
import { generateConfig } from "./generateStagehandConfig";
import { getLatestNpmVersion } from "./utils/npm";

const REPO_URL = "https://github.com/browserbase/stagehand-scaffold";
const REPO_BRANCH = "anirudh/update-2.0";
const TEMP_DIR = path.join(
  os.tmpdir(),
  "browserbase-clone-" + Math.random().toString(36).substr(2, 9)
);
const BB9_DIR = path.join(os.homedir(), ".bb9");
const STAGEHAND_ENV_FILE = path.join(BB9_DIR, "env");

// Function to save environment variables to temp directory
function saveEnvVariables(stagehandConfig: StagehandConfig) {
  let envContent = "";

  if (
    stagehandConfig?.browserbaseProjectId ||
    process.env.BROWSERBASE_PROJECT_ID
  ) {
    envContent += `BROWSERBASE_PROJECT_ID=${
      stagehandConfig?.browserbaseProjectId ??
      process.env.BROWSERBASE_PROJECT_ID
    }\n`;
  }

  if (stagehandConfig?.browserbaseApiKey || process.env.BROWSERBASE_API_KEY) {
    envContent += `BROWSERBASE_API_KEY=${
      stagehandConfig?.browserbaseApiKey ?? process.env.BROWSERBASE_API_KEY
    }\n`;
  }

  if (stagehandConfig?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
    envContent += `ANTHROPIC_API_KEY=${
      stagehandConfig?.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY
    }\n`;
  }

  if (stagehandConfig?.openaiApiKey || process.env.OPENAI_API_KEY) {
    envContent += `OPENAI_API_KEY=${
      stagehandConfig?.openaiApiKey ?? process.env.OPENAI_API_KEY
    }\n`;
  }

  if (envContent) {
    fs.mkdirSync(BB9_DIR, { recursive: true, mode: 0o700 });
    fs.writeFileSync(STAGEHAND_ENV_FILE, envContent, { mode: 0o600 });
  }
}

// Function to load environment variables from temp directory
function loadEnvVariables(): Partial<StagehandConfig> {
  if (!fs.existsSync(STAGEHAND_ENV_FILE)) {
    return {};
  }

  const envContent = fs.readFileSync(STAGEHAND_ENV_FILE, "utf-8");
  const envVars = envContent.split("\n").filter(Boolean);
  const config: Partial<StagehandConfig> = {};

  for (const line of envVars) {
    const [key, value] = line.split("=");
    switch (key) {
      case "BROWSERBASE_PROJECT_ID":
        config.browserbaseProjectId = value;
        break;
      case "BROWSERBASE_API_KEY":
        config.browserbaseApiKey = value;
        break;
      case "ANTHROPIC_API_KEY":
        config.anthropicApiKey = value;
        break;
      case "OPENAI_API_KEY":
        config.openaiApiKey = value;
        break;
    }
  }

  return config;
}

type StagehandConfig = ConstructorParams & {
  projectName: string;
  browserbaseProjectId?: string;
  browserbaseApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  example: string;
  useQuickstart: boolean;
  rules: "CURSOR" | "WINDSURF" | "NONE";
  modelName: string;
};

async function checkForLocalExample(example: string): Promise<string | null> {
  const localExamplePath = path.join(BB9_DIR, `${example}.ts`);
  if (fs.existsSync(localExamplePath)) {
    return fs.readFileSync(localExamplePath, "utf-8");
  }
  return null;
}

async function cloneExample(
  stagehandConfig: StagehandConfig,
  useAlpha: boolean = false,
  localExampleContent?: string
) {
  console.log(chalk.blue("Creating new browser app..."));

  try {
    // Save environment variables to temp directory
    saveEnvVariables(stagehandConfig);

    // Create temporary directory for cloning
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Clone the repository
    console.log(
      chalk.cyan(`Cloning template from the Browserbase Stagehand Scaffold:`) +
        ` ${REPO_URL} (branch: ${REPO_BRANCH})`
    );
    execSync(`git clone --depth 1 -b ${REPO_BRANCH} ${REPO_URL} ${TEMP_DIR}`, {
      stdio: "ignore",
    });

    // Create project directory
    const projectDir = path.resolve(
      process.cwd(),
      stagehandConfig?.projectName
    );
    if (fs.existsSync(projectDir)) {
      throw new Error(
        `Directory ${stagehandConfig?.projectName} already exists`
      );
    }

    if (localExampleContent) {
      console.log(chalk.cyan(`Using local example from ${BB9_DIR}`));
      stagehandConfig.example = "blank";
    }

    // Copy example to new project directory
    fs.copySync(TEMP_DIR, projectDir);

    // Handle rules file based on selection
    if (stagehandConfig.rules === "WINDSURF") {
      const rulesPath = path.join(projectDir, ".cursorrules");
      const newRulesPath = path.join(projectDir, ".windsurfrules");
      if (fs.existsSync(rulesPath)) {
        fs.renameSync(rulesPath, newRulesPath);
      }
    } else if (stagehandConfig.rules === "NONE") {
      const rulesPath = path.join(projectDir, ".cursorrules");
      if (fs.existsSync(rulesPath)) {
        fs.unlinkSync(rulesPath);
      }
    }
    // If CURSOR is selected, leave .cursorrules as is

    // Read project config
    const configPath = path.join(projectDir, "config.json");
    let projectConfig: Record<string, Record<string, string>> = {};
    if (fs.existsSync(configPath)) {
      projectConfig = fs.readJsonSync(configPath);
      fs.unlinkSync(configPath);
    }

    // Check if example exists in project config
    if (!(stagehandConfig.example in projectConfig)) {
      // Remove the projectDir and throw an error
      const validExamples = Object.keys(projectConfig);
      fs.rmSync(projectDir, { recursive: true, force: true });
      throw new Error(
        `Invalid example '${
          stagehandConfig.example
        }'. Please choose from: ${validExamples.join(", ")}`
      );
    }

    // Process file operations from config
    const exampleConfig = projectConfig[stagehandConfig.example];

    // Handle file operations
    for (const [sourceFile, operation] of Object.entries(exampleConfig)) {
      const sourcePath = path.join(projectDir, sourceFile);

      if (operation === "rm") {
        // Remove the file if it exists
        if (fs.existsSync(sourcePath)) {
          fs.unlinkSync(sourcePath);
        }
      } else {
        // Copy file
        const destPath = path.join(projectDir, operation);
        if (fs.existsSync(sourcePath)) {
          // Create parent directories if they don't exist
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copySync(sourcePath, destPath);
        }
      }
    }

    // Delete examples directory if it exists
    const examplesDir = path.join(projectDir, "examples");
    if (fs.existsSync(examplesDir)) {
      fs.rmSync(examplesDir, { recursive: true, force: true });
    }

    // Delete .git and re-init
    const gitDir = path.join(projectDir, ".git");
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });

      // Check if directory is not already part of a git repository
      try {
        execSync("git rev-parse --is-inside-work-tree", {
          stdio: "ignore",
          cwd: projectDir,
        });
      } catch {
        // Directory is not part of a git repo, so initialize one
        execSync(`git init`, {
          stdio: "ignore",
          cwd: projectDir,
        });
      }
    }

    // Update package.json name
    const packageJsonPath = path.join(projectDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = stagehandConfig?.projectName;

      packageJson.dependencies["@browserbasehq/stagehand"] = useAlpha
        ? "alpha"
        : await getLatestNpmVersion("@browserbasehq/stagehand");
      packageJson.dependencies["@browserbasehq/sdk"] =
        await getLatestNpmVersion("@browserbasehq/sdk");

      if (stagehandConfig.example === "custom-client-openai") {
        packageJson.dependencies.openai = await getLatestNpmVersion("openai");
      }
      if (stagehandConfig.example === "custom-client-aisdk") {
        packageJson.dependencies["ai"] = await getLatestNpmVersion("ai");
        packageJson.dependencies["@ai-sdk/openai"] = await getLatestNpmVersion(
          "@ai-sdk/openai"
        );
        packageJson.dependencies["openai"] = await getLatestNpmVersion(
          "openai"
        );
      }
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Write secrets to .env file
    // Initialize .env content
    let envContent = "";

    // Add environment variables if they exist
    if (
      stagehandConfig?.browserbaseProjectId ||
      process.env.BROWSERBASE_PROJECT_ID
    ) {
      envContent += `BROWSERBASE_PROJECT_ID=${
        stagehandConfig?.browserbaseProjectId ??
        process.env.BROWSERBASE_PROJECT_ID
      }\n`;
    }

    if (stagehandConfig?.browserbaseApiKey || process.env.BROWSERBASE_API_KEY) {
      envContent += `BROWSERBASE_API_KEY=${
        stagehandConfig?.browserbaseApiKey ?? process.env.BROWSERBASE_API_KEY
      }\n`;
    }

    if (stagehandConfig?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
      envContent += `ANTHROPIC_API_KEY=${
        stagehandConfig?.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY
      }\n`;
    }

    if (stagehandConfig?.openaiApiKey || process.env.OPENAI_API_KEY) {
      envContent += `OPENAI_API_KEY=${
        stagehandConfig?.openaiApiKey ?? process.env.OPENAI_API_KEY
      }\n`;
    }

    console.log(
      `Wrote environment variables to ${projectDir}/.env. Existing environment variables were taken from your environment.`
    );

    // Write all environment variables at once if we have any content
    if (envContent) {
      fs.writeFileSync(path.join(projectDir, ".env"), envContent);
    }

    // Write stagehand config
    fs.writeFileSync(
      path.join(projectDir, "stagehand.config.ts"),
      generateConfig(stagehandConfig)
    );

    // If we have local example content, replace main.ts
    if (localExampleContent) {
      const mainTsPath = path.join(projectDir, "index.ts");
      fs.writeFileSync(mainTsPath, localExampleContent);
    }

    // Run Prettier formatting
    console.log(chalk.blue("Formatting code with Prettier..."));
    try {
      execSync(`npx prettier --write .`, {
        stdio: "ignore",
        cwd: projectDir,
      });
    } catch (error) {
      console.warn(chalk.yellow("Warning: Failed to run Prettier formatting"));
    }

    console.log(
      boxen(
        chalk.yellow("\nLights, camera, act()!") +
          "\n\nEdit and run your Stagehand app:\n" +
          chalk.cyan(`  cd ${stagehandConfig?.projectName}\n`) +
          chalk.cyan(`  npm install\n`) +
          chalk.cyan("  npm start") +
          "\n\n" +
          `View and edit the code in ${chalk.cyan(
            `${stagehandConfig?.projectName}/index.ts`
          )}.` +
          "\n" +
          `Edit Stagehand config in ${chalk.yellow("stagehand.config.ts")}.` +
          "\n\n" +
          chalk.yellow(
            "Check out our docs for more information: https://docs.stagehand.dev"
          ),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    console.error(chalk.red("Error creating project:"), error);
    process.exit(1);
  } finally {
    // Cleanup temporary directory
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.warn(chalk.yellow("Warning: Failed to clean up temporary files"));
    }
  }
}

async function getStagehandConfig(
  example: string,
  projectName?: string
): Promise<StagehandConfig> {
  // Load saved environment variables
  const savedEnv = loadEnvVariables();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter a name for your project",
      when: () => !projectName || projectName === "",
      validate: (input: string) => {
        if (!input.trim()) {
          return "Project name cannot be empty";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "useQuickstart",
      message: "Would you like to start with a quickstart example?",
      when: () => !example || example === DEFAULT_EXAMPLE,
      default: true,
    },
    {
      type: "list",
      name: "modelName",
      message: "Select AI model (API key required)",
      choices: [
        {
          name: "Anthropic Claude 3.5 Sonnet",
          value: "claude-3-5-sonnet-20241022",
        },
        {
          name: "Anthropic Claude 3.7 Sonnet",
          value: "claude-3-7-sonnet-20250219",
        },
        { name: "OpenAI GPT-4o", value: "gpt-4o" },
        { name: "OpenAI GPT-4o mini", value: "gpt-4o-mini" },
        { name: "OpenAI o3-mini", value: "o3-mini" },
        {
          name: "Other: Vercel AI SDK (Azure, Bedrock, Gemini, etc.)",
          value: "aisdk",
        },
        {
          name: "Other: OpenAI Custom (Ollama, Gemini, etc.)",
          value: "custom_openai",
        },
      ],
      default: "gpt-4o-mini",
      when: () => !example.includes("custom-client"),
    },
    {
      type: "password",
      name: "anthropicApiKey",
      message: `Enter your Anthropic API key (${chalk.blue(
        "https://console.anthropic.com/settings/keys"
      )})`,
      when: (answers) =>
        answers.modelName &&
        answers.modelName.includes("claude") &&
        !process.env.ANTHROPIC_API_KEY &&
        !savedEnv.anthropicApiKey,
    },
    {
      type: "password",
      name: "openaiApiKey",
      message: `Enter your OpenAI API key (${chalk.blue(
        "https://platform.openai.com/api-keys"
      )})`,
      when: (answers) =>
        answers.modelName &&
        answers.modelName.includes("gpt") &&
        !process.env.OPENAI_API_KEY &&
        !savedEnv.openaiApiKey,
    },
    {
      type: "list",
      name: "rules",
      message: "Are you using Cursor or Windsurf?",
      choices: [
        {
          name: "Cursor",
          value: "CURSOR",
        },
        {
          name: "Windsurf",
          value: "WINDSURF",
        },
        {
          name: "None",
          value: "NONE",
        },
      ],
      default: "CURSOR",
    },
    {
      type: "list",
      name: "env",
      message: "Run locally or on Browserbase (60 minutes free)?",
      choices: [
        {
          name: "Local",
          value: "LOCAL",
        },
        {
          name: "Browserbase",
          value: "BROWSERBASE",
        },
      ],
      default: "LOCAL",
    },
    {
      type: "password",
      name: "browserbaseProjectId",
      message:
        "Go to Browserbase Settings: https://www.browserbase.com/settings\nEnter your project ID",
      when: (answers) =>
        answers.env === "BROWSERBASE" &&
        !process.env.BROWSERBASE_PROJECT_ID &&
        !savedEnv.browserbaseProjectId,
    },
    {
      type: "password",
      name: "browserbaseApiKey",
      message: "Enter your Browserbase API key",
      when: (answers) =>
        answers.env === "BROWSERBASE" &&
        !process.env.BROWSERBASE_API_KEY &&
        !savedEnv.browserbaseApiKey,
    },
  ]);

  let exampleName = example;
  if (answers.useQuickstart) {
    exampleName = "quickstart";
  }
  if (answers.modelName === "aisdk") {
    exampleName = answers.useQuickstart
      ? "custom-client-aisdk"
      : "custom-client-aisdk-blank";
  }
  if (answers.modelName === "custom_openai") {
    exampleName = answers.useQuickstart
      ? "custom-client-openai"
      : "custom-client-openai-blank";
  }

  // Merge saved environment variables with new answers
  return {
    ...answers,
    example: exampleName,
    projectName: projectName ?? answers.projectName,
    browserbaseProjectId:
      answers.browserbaseProjectId ?? savedEnv.browserbaseProjectId,
    browserbaseApiKey: answers.browserbaseApiKey ?? savedEnv.browserbaseApiKey,
    anthropicApiKey: answers.anthropicApiKey ?? savedEnv.anthropicApiKey,
    openaiApiKey: answers.openaiApiKey ?? savedEnv.openaiApiKey,
  };
}

const DEFAULT_EXAMPLE = "blank";
program
  .name("create-browser-app")
  .description(
    "Create a new browser application from browserbase/playbook examples"
  )
  .argument("[project-name]", "Name of the project")
  .option("-e, --example <example>", "Example to use", DEFAULT_EXAMPLE)
  .option("--alpha", "Use alpha version of @browserbasehq/stagehand")
  .action(
    async (
      projectName?: string,
      args?: { example?: string; alpha?: boolean }
    ) => {
      // Check for local example first
      const localExampleContent = await checkForLocalExample(
        args?.example ?? DEFAULT_EXAMPLE
      );

      const stagehandConfig = await getStagehandConfig(
        args?.example ?? DEFAULT_EXAMPLE,
        projectName
      );

      await cloneExample(
        stagehandConfig,
        args?.alpha ?? false,
        localExampleContent ?? undefined
      );
    }
  );

program.parse();
