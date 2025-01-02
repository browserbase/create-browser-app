# Create Browser App

A CLI tool to quickly create browser automation applications using Browserbase and Stagehand.

## Features

- Quick project scaffolding from Browserbase Playbook examples
- Interactive CLI setup process
- Support for both OpenAI GPT-4 and Anthropic Claude models
- Configurable environment (Local or Browserbase cloud)
- Built-in DOM debugging features
- Flexible caching options
- Automatic environment variable configuration

## Installation

```bash
npm install -g create-browser-app
```

## Usage

```bash
npx create-browser-app
```

## Run/Release

This project uses a `Makefile` to automate the release process. You can run `make run` to run the CLI and `make release` to release a new version.
