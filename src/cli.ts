#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function create(projectName: string) {
  const projectDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(projectDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists`));
    process.exit(1);
  }

  console.log(chalk.cyan(`Creating ${projectName}...`));

  // Copy template directory to project directory
  const templateDir = path.join(__dirname, "..", "template");
  fs.copySync(templateDir, projectDir);

  // Update package.json name
  const packageJsonPath = path.join(projectDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = projectName;
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Install dependencies
  console.log(chalk.cyan("Installing dependencies..."));
  execSync("npm install", { stdio: "inherit", cwd: projectDir });

  // Initialize git repository
  try {
    execSync("git init", { stdio: "ignore", cwd: projectDir });
    execSync("git add -A", { stdio: "ignore", cwd: projectDir });
    execSync('git commit -m "init stagehand app"', { stdio: "ignore", cwd: projectDir });
  } catch {
    // Git init failed, continue anyway
  }

  console.log(chalk.green(`\n✅ Created ${projectName}`));
  console.log("\nNext steps:");
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(chalk.cyan(`  cp .env.example .env  # Add your API keys`));
  console.log(chalk.cyan(`  npm start`));
}

program
  .name("create-browser-app")
  .description("Create a new browser application with Stagehand")
  .argument("[project-name]", "Name of the project")
  .action(async (projectName: string) => {
    let appName = projectName;
    
    if (!appName) {
      appName = await prompt(chalk.cyan("What would you like to name your app? "));
      
      if (!appName) {
        console.error(chalk.red("App name is required"));
        process.exit(1);
      }
    }
    
    create(appName).catch((err) => {
      console.error(chalk.red("Error creating project:"), err);
      process.exit(1);
    });
  });

program.parse();