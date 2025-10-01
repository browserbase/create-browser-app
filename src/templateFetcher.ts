import https from "https";
import { URL } from "url";

interface TemplateInfo {
  name: string;
  path: string;
  url: string;
}

const GITHUB_TEMPLATES: TemplateInfo[] = [
  {
    name: "example",
    path: "examples/example.ts",
    url: "https://raw.githubusercontent.com/browserbase/stagehand/main/examples/example.ts",
  },
  {
    name: "cua-example",
    path: "examples/cua-example.ts",
    url: "https://raw.githubusercontent.com/browserbase/stagehand/main/examples/cua-example.ts",
  },
  {
    name: "form-filling",
    path: "typescript/form-filling/index.ts",
    url: "https://raw.githubusercontent.com/browserbase/templates/refs/heads/dev/typescript/formFilling/index.ts?token=GHSAT0AAAAAAC7F2JVCCUDJV3FM42PGGMBE2G42AQQ",
  },
  {
    name: "gift-finder",
    path: "typescript/gift-finder/index.ts",
    url: "https://raw.githubusercontent.com/browserbase/templates/refs/heads/dev/typescript/giftfinder/index.ts?token=GHSAT0AAAAAAC7F2JVCDOP477A6M3KAEHOU2G42FLA",
  },
  {
    name: "pickleball",
    path: "typescript/pickleball/index.ts",
    url: "https://raw.githubusercontent.com/browserbase/templates/refs/heads/dev/typescript/pickleball/index.ts?token=GHSAT0AAAAAAC7F2JVCCUDJV3FM42PGGMBE2G42AQQ",
  },
  {
    name: "real-estate-check",
    path: "typescript/real-estate-check/index.ts",
    url: "https://raw.githubusercontent.com/browserbase/templates/refs/heads/dev/typescript/realEstateCheck/index.ts?token=GHSAT0AAAAAAC7F2JVCCUDJV3FM42PGGMBE2G42AQQ",
  },
  {
    name: "context",
    path: "typescript/context/index.ts",
    url: "https://raw.githubusercontent.com/browserbase/templates/refs/heads/dev/typescript/context/index.ts?token=GHSAT0AAAAAAC7F2JVCCUDJV3FM42PGGMBE2G42AQQ",
  },
];

export function getTemplateByName(name: string): TemplateInfo | undefined {
  return GITHUB_TEMPLATES.find((t) => t.name === name);
}

export function fetchTemplateContent(
  template: TemplateInfo
): Promise<string | null> {
  return new Promise((resolve) => {
    const url = new URL(template.url);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "User-Agent": "create-browser-app",
      },
    };

    https
      .get(options, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", () => {
        resolve(null);
      });
  });
}

export async function getAvailableTemplates(): Promise<string[]> {
  const defaultTemplates = ["basic"];
  const githubTemplates = GITHUB_TEMPLATES.map((t) => t.name);
  return [...defaultTemplates, ...githubTemplates];
}
