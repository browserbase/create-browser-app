#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import os from "os";

const REPO_URL = "https://github.com/browserbase/playbook.git";
const EXAMPLE_PATH = "create-browser-app";
const TEMP_DIR = path.join(
  os.tmpdir(),
  "browserbase-clone-" + Math.random().toString(36).substr(2, 9)
);

async function cloneExample(projectName: string) {
  console.log(chalk.blue("Creating new browser app..."));

  try {
    // Create temporary directory for cloning
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Clone the repository
    console.log(
      chalk.cyan(`Cloning template from the Browserbase Playbook:`) +
        ` ${REPO_URL}`
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
    const projectDir = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectDir)) {
      throw new Error(`Directory ${projectName} already exists`);
    }

    // Copy example to new project directory
    fs.copySync(exampleDir, projectDir);

    // Update package.json name
    const packageJsonPath = path.join(projectDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = projectName;
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    console.log(
      boxen(
        chalk.yellow("\nLights, camera, act()!") +
          "\n\nNext steps:\n" +
          chalk.cyan(`  cd ${projectName}\n`) +
          chalk.cyan("  npm install\n") +
          chalk.cyan("  npm start"),
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

program
  .name("create-browser-app")
  .description(
    "Create a new browser application from browserbase/playbook examples"
  )
  .argument("[project-name]", "Name of the project")
  .action(async (projectName?: string) => {
    if (!projectName) {
      console.error(chalk.red("Please provide a project name"));
      process.exit(1);
    }

    await cloneExample(projectName);
  });

program.parse();
