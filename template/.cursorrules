# Stagehand Project

This project uses Stagehand V4, the SDK for browser agents, with AI-powered `act`, `extract`, and `observe` methods.

The Stagehand client can be imported from `@browserbasehq/stagehand`.

**Key Classes:**

- `Stagehand`: Client providing `act`, `extract`, and `observe` methods
- `browser.context`: A `BrowserContext` object that manages pages, cookies, and the clipboard
- `page`: Individual page objects accessed via `browser.context.activePage()`, `browser.context.pages()`, or created with `browser.context.newPage()`

## Initialize

```typescript
import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) {
  throw new Error("BROWSERBASE_API_KEY is required");
}

const browser = await browserbase.launch({
  apiKey,
});

const stagehand = await Stagehand.create({
  browser,
  logging: { level: "debug" },
});

// Access the browser context and pages
const [page] = await browser.context.pages();
if (!page) {
  throw new Error("Stagehand initialized without an active page");
}
const context = browser.context;

// Create new pages if needed
const page2 = await browser.context.newPage();
```

## Act

Actions are called on the `stagehand` instance (not the page). `act` accepts either a string instruction or an `Action` returned by `observe`. Use atomic, specific instructions:

```typescript
// Act on the current active page
await stagehand.act("click the sign in button");

// Act on a specific page (when you need to target a page that isn't currently active)
await stagehand.act("click the sign in button", { page: page2 });
```

**Important:** Act instructions should be atomic and specific:

- ✅ Good: "Click the sign in button" or "Type 'hello' into the search input"
- ❌ Bad: "Order me pizza" or "Type in the search bar and hit enter" (multi-step)

### Observe + Act Pattern (Recommended)

Use `observe` to inspect a candidate action, then pass it to `act` for deterministic replay with no inference:

```typescript
const instruction = "Click the sign in button";

// Get candidate actions
const { data: actions } = await stagehand.observe(instruction);
const [action] = actions;

if (action?.method === "click") {
  await stagehand.act(action);
}
```

To target a specific page:

```typescript
const { data: actions } = await stagehand.observe("select blue as the favorite color", {
  page: page2,
});
const [action] = actions;

if (action) {
  await stagehand.act(action, { page: page2 });
}
```

## Extract

Extract data from pages using natural language instructions. The `extract` method is called on the `stagehand` instance and always takes both an instruction and a schema.

### Basic Extraction (with schema)

```typescript
import { z } from "zod/v4";

// Extract with explicit schema
const { data } = await stagehand.extract(
  "extract all apartment listings with prices and addresses",
  z.object({
    listings: z.array(
      z.object({
        price: z.string(),
        address: z.string(),
      }),
    ),
  }),
);

console.log(data.listings);
```

### Simple Extraction

```typescript
const { data } = await stagehand.extract(
  "extract the sign in button text",
  z.object({ buttonText: z.string() }),
);

console.log(data.buttonText); // "Sign in"
```

### Targeted Extraction

Extract data from a specific element using a locator:

```typescript
const { data } = await stagehand.extract(
  "extract the reason why script injection fails",
  z.object({ reason: z.string() }),
  { locator: page.locator("#script-injection-error") },
);

console.log(data.reason);
```

### URL Extraction

When extracting links or URLs, use `z.url()`:

```typescript
const { data: { links } } = await stagehand.extract(
  "extract all navigation links",
  z.object({
    links: z.array(z.url()),
  }),
);
```

### Extracting from a Specific Page

```typescript
// Extract from a specific page (when you need to target a page that isn't currently active)
const { data } = await stagehand.extract(
  "extract the placeholder text on the name field",
  z.object({ placeholder: z.string() }),
  { page: page2 },
);
```

## Observe

Discover candidate actions before executing them. Returns an array of actions in `data`:

```typescript
// Get candidate actions on the current active page
const { data: actions } = await stagehand.observe("Click the sign in button");
const [action] = actions;

if (action) {
  console.log(action.selector, action.method, action.arguments);
}
```

Observing on a specific page:

```typescript
// Target a specific page (when you need to target a page that isn't currently active)
const { data: actions } = await stagehand.observe("find the next page button", {
  page: page2,
});
const [action] = actions;

if (action) {
  await stagehand.act(action, { page: page2 });
}
```

## Advanced Features

### Locator (XPath Targeting)

Target specific elements across shadow DOM and iframes:

```typescript
await page
  .locator("xpath=/html/body/div[2]/div[3]/iframe/html/body/p")
  .highlight({
    durationMs: 5000,
    contentColor: { r: 255, g: 0, b: 0 },
  });
```

### Multi-Page Workflows

```typescript
const page1 = await browser.context.newPage("https://example.com");
const page2 = await browser.context.newPage("https://example2.com");

// Act/extract/observe operate on the current active page by default
// Pass { page } option to target a specific page
await stagehand.act("click button", { page: page1 });
await stagehand.extract(
  "get title",
  z.object({ title: z.string() }),
  { page: page2 },
);
```
