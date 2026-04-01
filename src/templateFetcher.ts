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

/**
 * Shared helper to fetch contents from a GitHub API path.
 * Returns parsed array of items (files and directories).
 */
function fetchGitHubContents(apiPath: string): Promise<GitHubAPIResponse[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: apiPath,
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
            resolve(items);
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

export async function fetchTypeScriptTemplates(): Promise<TemplateInfo[]> {
  const items = await fetchGitHubContents(
    "/repos/browserbase/templates/contents/typescript"
  );
  return items
    .filter((item) => item.type === "dir")
    .map((item) => buildTemplateInfo(item.name));
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

function fetchFromUrl(urlString: string): Promise<Buffer | null> {
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
        const chunks: Buffer[] = [];

        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }

        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      })
      .on("error", () => {
        resolve(null);
      });
  });
}

/**
 * Recursively fetches all files from a GitHub directory, descending into subdirectories.
 */
async function fetchFilesRecursive(
  apiPath: string
): Promise<GitHubAPIResponse[]> {
  const items = await fetchGitHubContents(apiPath);
  const files: GitHubAPIResponse[] = [];

  for (const item of items) {
    if (item.type === "file") {
      files.push(item);
    } else if (item.type === "dir") {
      const subFiles = await fetchFilesRecursive(
        `/repos/browserbase/templates/contents/${item.path}`
      );
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Fetches the list of all files in a template directory from GitHub (recursively)
 */
export function fetchTemplateFiles(
  templateName: string
): Promise<GitHubAPIResponse[]> {
  return fetchFilesRecursive(
    `/repos/browserbase/templates/contents/typescript/${templateName}`
  );
}

/**
 * Fetches all file contents from a template directory (recursively)
 * Returns a Map of relative path -> content buffer
 */
export async function fetchAllTemplateContents(
  templateName: string
): Promise<Map<string, Buffer>> {
  const files = await fetchTemplateFiles(templateName);
  const contents = new Map<string, Buffer>();
  const prefix = `typescript/${templateName}/`;

  // Fetch all files in parallel
  const fetchPromises = files.map(async (file) => {
    if (file.download_url) {
      const content = await fetchFromUrl(file.download_url);
      if (content !== null) {
        const relativePath = file.path.startsWith(prefix)
          ? file.path.slice(prefix.length)
          : file.name;
        contents.set(relativePath, content);
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
