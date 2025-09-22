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
      path: url.pathname,
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
