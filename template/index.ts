import "dotenv/config";
import { browserbase, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod/v4";

async function main() {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERBASE_API_KEY is required");
  }

  const browser = await browserbase.launch({
    apiKey,
  });

  try {
    const stagehand = await Stagehand.create({ browser });

    try {
      console.log("Stagehand session started");

      const [page] = await browser.context.pages();
      if (!page) {
        throw new Error("No page was created for the browser session");
      }

      await page.goto("https://example.com");

      const extractResult = await stagehand.extract(
        "Extract the page heading and description.",
        z.object({
          heading: z.string(),
          description: z.string(),
        })
      );
      console.log("Extract result:\n", extractResult.data);

      const observeResult = await stagehand.observe(
        "Find the link that provides more information."
      );
      console.log("Observe result:\n", observeResult.data);

      const [moreInfoAction] = observeResult.data;
      if (moreInfoAction?.method !== "click") {
        throw new Error("Could not find the expected link action");
      }

      const actResult = await stagehand.act(moreInfoAction);
      console.log("Act result:\n", actResult.data);

      if (!actResult.data.success) {
        throw new Error(`act() failed: ${actResult.data.message}`);
      }
    } finally {
      await stagehand.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
