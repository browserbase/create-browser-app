# Stagehand V4 Project

This project uses Stagehand V4, a browser-agent SDK with deterministic browser APIs and AI-powered `act`, `observe`, and `extract` methods.

## Core lifecycle

Create the browser first, then attach Stagehand asynchronously:

```ts
import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const browser = await browserbase.launch({
  apiKey: process.env.BROWSERBASE_API_KEY,
});
const stagehand = await Stagehand.create({ browser });

try {
  const [page] = await browser.context.pages();
  await page.goto("https://example.com");
} finally {
  await stagehand.close();
  await browser.close();
}
```

Use `localBrowser.launch()` instead of `browserbase.launch()` for a local Chrome session. A local session also needs an explicit model in `Stagehand.create()` because it cannot use Browserbase Model Gateway.

## Stagehand primitives

Call AI primitives on the Stagehand instance. Every result uses a `{ data, metadata }` envelope.

```ts
const action = await stagehand.act("Click the sign-in button");
if (!action.data.success) {
  throw new Error(action.data.message);
}

const actions = await stagehand.observe("Find the submit button");
if (actions.data.length > 0) {
  await stagehand.act(actions.data[0]);
}

const result = await stagehand.extract("Extract the page title");
console.log(result.data.extraction);
```

For typed extraction, pass a Zod V4 schema as the second argument:

```ts
import { z } from "zod/v4";

const result = await stagehand.extract(
  "Extract the product name and price",
  z.object({
    name: z.string(),
    price: z.number(),
  })
);

console.log(result.data.name, result.data.price);
```

Pass `{ page }` in the options when targeting a page other than the active page:

```ts
await stagehand.act("Click the next button", { page: anotherPage });
```

## Browser and page APIs

Use the browser handle for contexts and pages:

```ts
const pages = await browser.context.pages();
const page = await browser.context.newPage("https://example.com");
await browser.context.setActivePage(page);
```

Use deterministic APIs when you know the exact interaction:

```ts
await page.locator("button[type=submit]").click();
await page.locator("input[name=email]").fill("user@example.com");
await page.waitForTimeout(500);
```

Stagehand V4 drives Chrome directly over CDP. Do not use Playwright or Puppeteer page objects with this SDK.

## V4 differences to remember

- Do not call `new Stagehand()` or `stagehand.init()`; use `await Stagehand.create({ browser })`.
- Do not access `stagehand.context`; use `browser.context`.
- Do not expect raw values from AI primitives; read `result.data`.
- Stagehand V4 has no autonomous `agent()` API. Implement multi-step flows in application control flow.
- Close Stagehand and the browser separately.
