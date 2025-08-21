import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";

async function main() {
  const stagehand = new Stagehand({
    env: "BROWSERBASE"
  });

  await stagehand.init();

  console.log(`\n\x1b[36mStagehand Session Started\x1b[0m`);
  console.log(`Watch live: \x1b[34mhttps://browserbase.com/sessions/${stagehand.browserbaseSessionID}\x1b[0m\n`);

  const page = stagehand.page;

  await page.goto("https://stagehand.dev");

  const extractResult = await page.extract("Extract the value proposition from the page.");
  console.log(`Extract result:\n`, extractResult);

  const actResult = await page.act("Click the 'Get Started' button.");
  console.log(`Act result:\n`, actResult);

  const observeResult = await page.observe("What can I click on this page?");
  console.log(`Observe result:\n`, observeResult);

  await stagehand.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
