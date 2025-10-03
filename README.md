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
- `example` - General Stagehand example
- `cua-example` - Computer Use Agent example
- `form-filling` - Automated form filling
- `gift-finder` - Gift recommendation finder
- `pickleball` - Pickleball court booking
- `license-verification` - Real estate data extraction
- `context` - Browser context management
- `proxies` - Browser proxy management

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

