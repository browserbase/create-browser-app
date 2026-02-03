import https from "https";
import { URL } from "url";

interface TemplateInfo {
  name: string;
  path: string;
}

interface GitHubAPIResponse {
  name: string;
  type: string;
  path: string;
  download_url?: string;
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
    path: `typescript/${name}`,
  };
}

export async function getTemplateByName(
  name: string
): Promise<TemplateInfo | undefined> {
  const templates = await fetchTypeScriptTemplates();
  return templates.find((t) => t.name === name);
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

/**
 * Fetches the list of all files in a template directory from GitHub
 */
export function fetchTemplateFiles(
  templateName: string
): Promise<GitHubAPIResponse[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: `/repos/browserbase/templates/contents/typescript/${templateName}`,
      method: "GET",
      headers: {
        "User-Agent": "create-browser-app",
        Accept: "application/vnd.github+json",
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
            // Filter to only include files (not directories)
            const files = items.filter((item) => item.type === "file");
            resolve(files);
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
 * Fetches all file contents from a template directory
 * Returns a Map of filename -> content
 */
export async function fetchAllTemplateContents(
  templateName: string
): Promise<Map<string, string>> {
  const files = await fetchTemplateFiles(templateName);
  const contents = new Map<string, string>();

  // Fetch all files in parallel
  const fetchPromises = files.map(async (file) => {
    if (file.download_url) {
      const content = await fetchFromUrl(file.download_url);
      if (content !== null) {
        contents.set(file.name, content);
      }
    }
  });

  await Promise.all(fetchPromises);
  return contents;
}

export async function getAvailableTemplates(): Promise<string[]> {
  const defaultTemplates = ["basic"];
  const templates = await fetchTypeScriptTemplates();
  const githubTemplates = templates.map((t) => t.name);
  return [...defaultTemplates, ...githubTemplates];
}
