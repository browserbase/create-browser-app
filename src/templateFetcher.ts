import https from "https";
import { URL } from "url";

interface TemplateInfo {
  name: string;
  path: string;
  url: string;
  readmeUrl: string;
  packageJsonUrl: string;
  envExampleUrl: string;
}

interface GitHubAPIResponse {
  name: string;
  type: string;
  path: string;
}


export function fetchTypeScriptTemplates(): Promise<TemplateInfo[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: "/repos/browserbase/templates/contents/typescript",
      method: "GET",
      headers: {
        "User-Agent": "create-browser-app",
        "Accept": "application/vnd.github+json",
      },
    };

    https
      .get(options, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          resolve([]);
          return;
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const items: GitHubAPIResponse[] = JSON.parse(data);
            const templates = items
              .filter((item) => item.type === "dir")
              .map((item) => buildTemplateInfo(item.name));
            resolve(templates);
          } catch (error) {
            resolve([]);
          }
        });
      })
      .on("error", () => {
        resolve([]);
      });
  });
}

/**
 * Builds a TemplateInfo object from a template name (directory slug)
 */
function buildTemplateInfo(name: string): TemplateInfo {
  return {
    name,
    path: `typescript/${name}/index.ts`,
    url: `https://raw.githubusercontent.com/browserbase/templates/dev/typescript/${name}/index.ts`,
    readmeUrl: `https://raw.githubusercontent.com/browserbase/templates/dev/typescript/${name}/README.md`,
    packageJsonUrl: `https://raw.githubusercontent.com/browserbase/templates/dev/typescript/${name}/package.json`,
    envExampleUrl: `https://raw.githubusercontent.com/browserbase/templates/dev/typescript/${name}/.env.example`,
  };
}

export async function getTemplateByName(
  name: string
): Promise<TemplateInfo | undefined> {
  const templates = await fetchTypeScriptTemplates();
  return templates.find((t) => t.name === name);
}

export function fetchTemplateContent(
  template: TemplateInfo
): Promise<string | null> {
  return fetchFromUrl(template.url);
}

export function fetchTemplateReadme(
  template: TemplateInfo
): Promise<string | null> {
  return fetchFromUrl(template.readmeUrl);
}

export function fetchTemplatePackageJson(
  template: TemplateInfo
): Promise<string | null> {
  return fetchFromUrl(template.packageJsonUrl);
}

export function fetchTemplateEnvExample(
  template: TemplateInfo
): Promise<string | null> {
  return fetchFromUrl(template.envExampleUrl);
}

function fetchFromUrl(urlString: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = new URL(urlString);

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
  const templates = await fetchTypeScriptTemplates();
  const githubTemplates = templates.map((t) => t.name);
  return [...defaultTemplates, ...githubTemplates];
}
