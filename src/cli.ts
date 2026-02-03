#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import boxen from "boxen";
import { getTemplateByName, fetchAllTemplateContents } from "./templateFetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function showLogo() {
  console.log(
    chalk.yellow(`
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡾⠻⣶⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢠⡶⠛⢳⡆⠀⠀⠀⠀⢸⡇⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⢸⣷⠶⣦⣴⠶⣾⡇⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⢸⡇⠀⢸⡇⠀⢸⡇⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠘⠷⣤⢾⡏⠉⠉⠉⠙⣾⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠈⣻⡿⠟⠂⠀⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠀⠀⠀⠀⢰⡏⠀⠀⠀⢀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣷⡀⠀⠀⠀⠀⠀⠀⢀⡾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠷⣦⣤⣤⣴⠾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`)
  );
  console.log(chalk.yellow.bold("Stagehand"));
  console.log(chalk.dim("The AI Browser Framework\n"));
}

async function main(
  name: string = "my-stagehand-app",
  template: string = "basic"
) {
  showLogo();

  const projectName = name;

  // Sanitize project name for directory
  const projectDir = projectName
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/_/g, "-");
  const projectPath = path.resolve(process.cwd(), projectDir);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.error(
      chalk.red(
        `Error: Directory '${projectDir}' already exists. Give your app a different name by calling \`npx create-browser-app <name>\``
      )
    );
    process.exit(1);
  }

  // Create project structure
  try {
    console.log(`Creating ${chalk.bold.cyan(projectDir)}...\n`);

    // Create directories
    fs.mkdirSync(projectPath, { recursive: true });

    // Determine which template to use
    let useGithubTemplate = false;
    let templateFiles = new Map<string, string>();

    // If not using basic template, try to fetch from GitHub
    if (template !== "basic") {
      console.log(`Fetching template ${chalk.cyan(template)}...`);
      const templateInfo = await getTemplateByName(template);
      if (templateInfo) {
        templateFiles = await fetchAllTemplateContents(template);
        if (templateFiles.size > 0) {
          useGithubTemplate = true;
          console.log(
            chalk.green("✓") + ` Using template: ${template} (${templateFiles.size} files)`
          );
        } else {
          console.log(
            chalk.yellow("⚠") +
              ` Could not fetch template, using basic template`
          );
        }
      } else {
        console.log(
          chalk.yellow("⚠") +
            ` Template '${template}' not found, using basic template`
        );
      }
    }

    // Copy template directory to project directory
    const templateDir = path.join(__dirname, "..", "template");
    fs.copySync(templateDir, projectPath);

    // If we have GitHub template files, overwrite with them
    if (useGithubTemplate && templateFiles.size > 0) {
      for (const [filename, content] of templateFiles) {
        const filePath = path.join(projectPath, filename);
        fs.writeFileSync(filePath, content);
      }
    }

    // Update package.json name
    const packageJsonPath = path.join(projectPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = projectName;
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Update README.md with project name
    const readmePath = path.join(projectPath, "README.md");
    if (fs.existsSync(readmePath)) {
      let readme = fs.readFileSync(readmePath, "utf-8");
      readme = readme.replace(/# Stagehand Project/g, `# ${projectName}`);
      fs.writeFileSync(readmePath, readme);
    }

    // Success message
    console.log(
      chalk.green("✓") + ` Find your project at ${chalk.cyan(projectPath)}\n`
    );

    // Styled next steps
    const nextSteps = `${chalk.bold.cyan("1.")} cd ${projectDir}
${chalk.bold.cyan("2.")} npm install
${chalk.bold.cyan("3.")} cp .env.example .env
${chalk.bold.cyan("4.")} ${chalk.dim("Add your Browserbase API key to .env")}
${chalk.bold.cyan("5.")} npm start`;

    console.log(
      boxen(nextSteps, {
        title: chalk.bold.yellow("🚀 Launch now 🚀"),
        titleAlignment: "center",
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      })
    );
  } catch (error) {
    console.error(chalk.red(`Error creating project: ${error}`));
    process.exit(1);
  }
}

program
  .name("create-browser-app")
  .description("Start your Stagehand project with a single command")
  .argument("[name]", "Name of the project")
  .option(
    "-t, --template <template>",
    "Template to use (basic or GitHub examples: example, cua-example)",
    "basic"
  )
  .action(async (name: string | undefined, options: { template: string }) => {
    // If no name provided, use template name (or default for basic template)
    const projectName = name ?? (options.template !== "basic" ? options.template : "my-stagehand-app");
    await main(projectName, options.template).catch((err) => {
      console.error(chalk.red("Error:"), err);
      process.exit(1);
    });
  });

program.parse();
