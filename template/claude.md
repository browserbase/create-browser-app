# Stagehand Project

This is a project that uses Stagehand V4, a browser automation framework with AI-powered `act`, `extract`, and `observe` methods.

The main class can be imported as `Stagehand` from `@browserbasehq/stagehand`.

**Key Classes:**

- `Stagehand`: Main orchestrator class providing `act`, `extract`, and `observe` methods
- `context`: A `BrowserContext` object accessed through `browser.context` that manages pages
- `page`: Individual page objects accessed via `(await browser.context.pages())[i]` or created with `browser.context.newPage()`

## Initialize

```typescript
import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const browser = await browserbase.launch({
  apiKey: process.env.BROWSERBASE_API_KEY,
});

const stagehand = await Stagehand.create({
  browser,
  logging: { level: "debug" },
});

// Access the browser context and pages
const page = (await browser.context.pages())[0];
const context = browser.context;

// Create new pages if needed
const page2 = await browser.context.newPage();
```

## Act

Actions are called on the `stagehand` instance (not the page). Use atomic, specific instructions:

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

Cache the results of `observe` to avoid unexpected DOM changes:

```typescript
const instruction = "Click the sign in button";

// Get candidate actions
const { data: actions } = await stagehand.observe(instruction);

// Execute the first action
await stagehand.act(actions[0]);
```

To target a specific page:

```typescript
const { data: actions } = await stagehand.observe("select blue as the favorite color", {
  page: page2,
});
await stagehand.act(actions[0], { page: page2 });
```

## Extract

Extract data from pages using natural language instructions. The `extract` method is called on the `stagehand` instance.

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

### Simple Extraction (without schema)

```typescript
// Extract returns a default object with 'extraction' field
const result = await stagehand.extract("extract the sign in button text");

console.log(result.data);
// Output: { extraction: "Sign in" }

// Or destructure directly
const {
  data: { extraction },
} = await stagehand.extract("extract the sign in button text");
console.log(extraction); // "Sign in"
```

### Targeted Extraction

Extract data from a specific element using a selector:

```typescript
const { data: reason } = await stagehand.extract(
  "extract the reason why script injection fails",
  z.string(),
  { selector: "#script-injection-error" },
);
```

### URL Extraction

When extracting links or URLs, use `z.string().url()`:

```typescript
const { data: { links } } = await stagehand.extract(
  "extract all navigation links",
  z.object({
    links: z.array(z.string().url()),
  }),
);
```

### Extracting from a Specific Page

```typescript
// Extract from a specific page (when you need to target a page that isn't currently active)
const { data } = await stagehand.extract(
  "extract the placeholder text on the name field",
  { page: page2 },
);
```

## Observe

Plan actions before executing them. Returns an array of candidate actions in `data`:

```typescript
// Get candidate actions on the current active page
const { data: [action] } = await stagehand.observe("Click the sign in button");

// Execute the action
await stagehand.act(action);
```

Observing on a specific page:

```typescript
// Target a specific page (when you need to target a page that isn't currently active)
const { data: actions } = await stagehand.observe("find the next page button", {
  page: page2,
});
await stagehand.act(actions[0], { page: page2 });
```

## Advanced Features

### Locator (XPath Targeting)

Target specific elements across shadow DOM and iframes:

```typescript
await page
  .locator("/html/body/div[2]/div[3]/iframe/html/body/p")
  .highlight({
    durationMs: 5000,
    contentColor: { r: 255, g: 0, b: 0 },
  });
```

### Multi-Page Workflows

```typescript
const page1 = (await browser.context.pages())[0];
await page1.goto("https://example.com");

const page2 = await browser.context.newPage();
await page2.goto("https://example2.com");

// Act/extract/observe operate on the current active page by default
// Pass { page } option to target a specific page
await stagehand.act("click button", { page: page1 });
await stagehand.extract("get title", { page: page2 });
```
