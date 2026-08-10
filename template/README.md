# 🤘 Welcome to Stagehand!

Hey! This is a project built with [Stagehand](https://github.com/browserbase/stagehand).

You can build your own browser agent using `npx create-browser-app`.

## Setting the Stage

Stagehand is the SDK for browser agents. V4 combines deterministic code with AI-powered browser primitives, so you control which steps run as plain selectors and which ones call a model.

## Curtain Call

Stagehand V4 requires Node.js 22.18 or newer. Install dependencies, then run the example:

```bash
pnpm install
pnpm start
```

## What's Next?

### Add your API keys

Required API keys/environment variables are in the `.env.example` file. Copy it to `.env` and add your API keys.

```bash
cp .env.example .env && nano .env # Add your API keys to .env
```

### Stagehand guidance

This project includes Stagehand V4 guidance for coding agents in `.cursorrules` and `claude.md`.

### Browser lifecycle

V4 separates the browser from the Stagehand client: launch a browser with `browserbase.launch()`, attach it with `Stagehand.create()`, and close both objects when the run finishes. To run Chrome locally instead, use `localBrowser.launch()` and provide a model when creating Stagehand.
