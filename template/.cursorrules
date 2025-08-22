# Stagehand Project

This is a project that uses [Stagehand](https://github.com/browserbase/stagehand), which amplifies Playwright with AI-powered `act`, `extract`, and `observe` methods added to the Page class.

`Stagehand` is a class that provides configuration and browser automation capabilities with:
- `stagehand.page`: A StagehandPage object (extends Playwright Page)
- `stagehand.context`: A StagehandContext object (extends Playwright BrowserContext)
- `stagehand.agent()`: Create AI-powered agents for autonomous multi-step workflows
- `stagehand.init()`: Initialize the browser session
- `stagehand.close()`: Clean up resources

`Page` extends Playwright's Page class with AI-powered methods:
- `act()`: Perform actions on web elements using natural language
- `extract()`: Extract structured data from pages using schemas
- `observe()`: Plan actions and get selectors before executing

`Agent` provides autonomous Computer Use Agent capabilities:
- `execute()`: Perform complex multi-step tasks using natural language instructions

`Context` extends Playwright's BrowserContext class for browser session management.

Use the following rules to write code for this project.

- To plan an instruction like "click the sign in button", use Stagehand `observe` to get the action to execute.

```typescript
const results = await page.observe("Click the sign in button");
```

You can also pass in the following params:

```typescript
await page.observe({
  instruction: "the instruction to execute",
  returnAction: true 
});
```

- The result of `observe` is an array of `ObserveResult` objects that can directly be used as params for `act` like this:
  ```typescript
  const results = await page.observe({
    instruction: "the instruction to execute",
    returnAction: true, // return the action to execute
  });

  await page.act(results[0]);
  ```
  
- When writing code that needs to extract data from the page, use Stagehand `extract`. Explicitly pass the following params by default:

```typescript
const { someValue } = await page.extract({
  instruction: "the instruction to execute",
  schema: z.object({
    someValue: z.string(),
  }), // The schema to extract
});
```

## Initialize

```typescript
import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE"
});

await stagehand.init();

const page = stagehand.page; // Playwright Page with act, extract, and observe methods

const context = stagehand.context; // Playwright BrowserContext
```
### Configuration Options
```typescript
const StagehandConfig = {
  env: "BROWSERBASE" | "LOCAL", // Environment to run in
  apiKey: process.env.BROWSERBASE_API_KEY, // Browserbase API key
  projectId: process.env.BROWSERBASE_PROJECT_ID, // Browserbase project ID
  debugDom: true, // Enable DOM debugging features
  headless: false, // Run browser in headless mode
  domSettleTimeoutMs: 30_000, // Timeout for DOM to settle
  enableCaching: true, // Enable action caching
  modelName: "gpt-4o", // AI model to use
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY, // OpenAI API key
  },
};
```
## Act

You can act directly with string instructions:

```typescript
await page.act("Click the sign in button");
```

Use variables for dynamic form filling:

```typescript
await page.act({
  action: `Enter the following information:
    Name: %name%
    Email: %email%
    Phone: %phone%`,
  variables: {
    name: "John Doe",
    email: "john@example.com", 
    phone: "+1-555-0123"
  }
});
```

**Best Practices:**
- Cache the results of `observe` to avoid unexpected DOM changes
- Keep actions atomic and specific (e.g., "Click the sign in button" not "Sign in to the website")
- Use variable substitution for dynamic data entry

Act `action` should be as atomic and specific as possible, i.e. "Click the sign in button" or "Type 'hello' into the search input".
AVOID actions that are more than one step, i.e. "Order me pizza" or "Send an email to Paul asking him to call me".

## Extract

### Simple String Extraction

```typescript
const signInButtonText = await page.extract("extract the sign in button text");
```

### Structured Extraction with Schema (Recommended)

Always use Zod schemas for structured data extraction:

```typescript
import { z } from "zod";

const data = await page.extract({
  instruction: "extract the sign in button text",
  schema: z.object({
    text: z.string(),
  }),
});
```

### Array Extraction

To extract multiple items, wrap the array in a single object:

```typescript
const data = await page.extract({
  instruction: "extract the text inside all buttons",
  schema: z.object({
    buttons: z.array(z.string()),
  })
});
```

### Complex Object Extraction

For more complex data structures:

```typescript
const productData = await page.extract({
  instruction: "extract product information from this page",
  schema: z.object({
    title: z.string(),
    price: z.number(),
    description: z.string(),
    features: z.array(z.string()),
    availability: z.boolean(),
  }),
});
```

### Schema Validation

```typescript
import { validateZodSchema } from "./utils.js";
import { z } from "zod";

const schema = z.object({ name: z.string() });
const isValid = validateZodSchema(schema, { name: "John" }); // true
```

## Agent System

Stagehand provides an Agent System for autonomous web browsing using Computer Use Agents (CUA). Agents execute multi-step workflows using natural language instructions.

### Creating Agents

```typescript
// Basic agent (default)
const agent = stagehand.agent();

// OpenAI agent
const agent = stagehand.agent({
  provider: "openai",
  model: "computer-use-preview",
  instructions: "You are a helpful assistant that can use a web browser.",
  options: { 
    apiKey: process.env.OPENAI_API_KEY 
  }
});

// Anthropic agent
const agent = stagehand.agent({
  provider: "anthropic", 
  model: "claude-sonnet-4-20250514",
  instructions: "You are a helpful assistant that can use a web browser.",
  options: { 
    apiKey: process.env.ANTHROPIC_API_KEY 
  }
});
```
### Agent Execution
```typescript
// Simple task
const result = await agent.execute("Extract the title from this webpage");

// Complex multi-step task
const result = await agent.execute({
  instruction: "Apply for the first engineer position with mock data",
  maxSteps: 20,
  autoScreenshot: true
});
```

### Best Practices
- Be specific with instructions: `"Fill out the contact form with name 'John Doe' and submit it"`
- Break down complex tasks into smaller steps
- Use error handling with try/catch blocks
- Combine agents for navigation with traditional methods for precise data extraction

```typescript
// Good: Specific instructions
await agent.execute("Navigate to products page and filter by 'Electronics'");

// Avoid: Vague instructions  
await agent.execute("Do some stuff on this page");
```

## Project Structure Best Practices

- Store configurations in `stagehand.config.ts`
- Use environment variables for API keys (see `.env.example`)
- Implement main automation logic in functions that accept `{ page, context, stagehand }`
- Use TypeScript with proper imports from `@browserbasehq/stagehand`