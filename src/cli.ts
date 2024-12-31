#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { execSync } from "child_process";
import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import { ConstructorParams } from "@browserbasehq/stagehand";
import { generateConfig } from "./generateStagehandConfig";
const REPO_URL = "https://github.com/browserbase/playbook";
const EXAMPLE_PATH = "stagehand-quickstart";
const TEMP_DIR = path.join(
  os.tmpdir(),
  "browserbase-clone-" + Math.random().toString(36).substr(2, 9)
);

type StagehandConfig = ConstructorParams & {
  projectName: string;
  browserbaseProjectId?: string;
  browserbaseApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  example: string;
};

async function cloneExample(stagehandConfig: StagehandConfig) {
  console.log(chalk.blue("Creating new browser app..."));

  try {
    // Create temporary directory for cloning
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Clone the repository
    console.log(
      chalk.cyan(`Cloning template from the Browserbase Playbook:`) +
        ` ${REPO_URL}/tree/main/${EXAMPLE_PATH}`
    );
    execSync(`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`, {
      stdio: "ignore",
    });

    // Ensure the example directory exists
    const exampleDir = path.join(TEMP_DIR, EXAMPLE_PATH);
    if (!fs.existsSync(exampleDir)) {
      throw new Error(
        `Example directory '${EXAMPLE_PATH}' not found in repository`
      );
    }

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

    // Copy example to new project directory
    fs.copySync(exampleDir, projectDir);

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
        // Rename file
        const destPath = path.join(projectDir, operation);
        if (fs.existsSync(sourcePath)) {
          fs.renameSync(sourcePath, destPath);
        }
      }
    }

    // Update package.json name
    const packageJsonPath = path.join(projectDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = stagehandConfig?.projectName;
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
          )}.\nRun the app with ${chalk.cyan("npm start")}`,
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
      type: "list",
      name: "modelName",
      message: "Select AI model to use",
      choices: [
        { name: "OpenAI GPT-4o", value: "gpt-4o" },
        {
          name: "Anthropic Claude 3.5 Sonnet",
          value: "claude-3-5-sonnet-20241022",
        },
      ],
      default: "gpt-4o",
    },
    {
      type: "input",
      name: "anthropicApiKey",
      message: "Enter your Anthropic API key",
      when: (answers) =>
        answers.modelName.includes("claude") && !process.env.ANTHROPIC_API_KEY,
    },
    {
      type: "input",
      name: "openaiApiKey",
      message: "Enter your OpenAI API key",
      when: (answers) =>
        answers.modelName.includes("gpt") && !process.env.OPENAI_API_KEY,
    },
    {
      type: "list",
      name: "env",
      message:
        "Would you like to run locally or on Browserbase (10 free sessions)?",
      choices: [
        {
          name: "Browserbase",
          value: "BROWSERBASE",
        },
        {
          name: "Local",
          value: "LOCAL",
        },
      ],
      default: "BROWSERBASE",
    },
    {
      type: "input",
      name: "browserbaseProjectId",
      message:
        "Go to Browserbase Settings: https://www.browserbase.com/settings\nEnter your project ID",
      when: (answers) =>
        answers.env === "BROWSERBASE" && !process.env.BROWSERBASE_PROJECT_ID,
    },
    {
      type: "input",
      name: "browserbaseApiKey",
      message: "Enter your Browserbase API key",
      when: (answers) =>
        answers.env === "BROWSERBASE" && !process.env.BROWSERBASE_API_KEY,
    },
    {
      type: "confirm",
      name: "debugDom",
      message: "Enable DOM debugging features?",
      default: true,
    },
    {
      type: "confirm",
      name: "headless",
      message: "Run browser in headless mode?",
      default: false,
      when: (answers) => answers.env === "LOCAL",
    },
    {
      type: "confirm",
      name: "enableCaching",
      message: "Enable prompt caching?",
      default: true,
    },
  ]);
  return {
    ...answers,
    example: example,
    projectName: projectName ?? answers.projectName,
  };
}

const DEFAULT_EXAMPLE = "default";
program
  .name("create-browser-app")
  .description(
    "Create a new browser application from browserbase/playbook examples"
  )
  .argument("[project-name]", "Name of the project")
  .option("-e, --example <example>", "Example to use", DEFAULT_EXAMPLE)
  .action(async (projectName?: string, args?: { example?: string }) => {
    const stagehandConfig = await getStagehandConfig(
      args?.example ?? DEFAULT_EXAMPLE,
      projectName
    );

    await cloneExample(stagehandConfig);
  });

program.parse();
