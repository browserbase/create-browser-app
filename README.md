# Create Browser App

A CLI tool to quickly create browser automation applications using [Browserbase](https://browserbase.com) and [Stagehand](https://stagehand.dev).

## Features

- 🚀 Quick Stagehand project scaffolding
- 📦 Multiple pre-built templates from GitHub
- 🎯 Configurable environment (Local or Browserbase cloud)
- ⚡ Zero-config setup with sensible defaults
- 🔧 TypeScript support out of the box

## Installation

You don't need to install anything! Just run:

```bash
npx create-browser-app
```

## Usage

### Basic Usage

Create a new project with default settings:

```bash
npx create-browser-app my-project-name
```

### Using Templates

Create a project with a specific template:

```bash
npx create-browser-app my-project-name --template example
```

Available templates:
- `basic` (default) - Basic Stagehand project setup
- Additional templates are automatically fetched from the [browserbase/templates](https://github.com/browserbase/templates/tree/dev/typescript) repository

Examples include: `form-filling`, `gift-finder`, `pickleball`, `license-verification`, `context`, `proxies`, `gemini-cua`, and more
### Getting Started

After creating your project:

```bash
cd my-project-name
npm install
cp .env.example .env
# Add your Browserbase API key to .env
npm start
```

## Learn More

- [Stagehand Documentation](https://docs.stagehand.dev)
- [Browserbase Documentation](https://docs.browserbase.com)

