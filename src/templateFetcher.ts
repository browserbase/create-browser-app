import https from "https";
import { URL } from "url";
import AdmZip, { IZipEntry } from "adm-zip";

interface TemplateInfo {
  name: string;
  path: string;
}

const TEMPLATE_ARCHIVE_URL =
  "https://codeload.github.com/browserbase/templates/zip/refs/heads/dev";
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

let archivePromise: Promise<AdmZip> | undefined;

function fetchBuffer(urlString: string, redirectsLeft = 3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    https
      .get(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "GET",
          headers: { "User-Agent": "create-browser-app" },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            res.resume();
            resolve(
              fetchBuffer(
                new URL(res.headers.location, urlString).toString(),
                redirectsLeft - 1
              )
            );
            return;
          }

          if (res.statusCode !== 200) {
            res.resume();
            reject(
              new Error(
                `Template archive request failed with HTTP ${res.statusCode ?? "unknown"}`
              )
            );
            return;
          }

          const contentLength = Number(res.headers["content-length"] ?? 0);
          if (contentLength > MAX_ARCHIVE_BYTES) {
            res.resume();
            reject(new Error("Template archive is unexpectedly large"));
            return;
          }

          const chunks: Buffer[] = [];
          let receivedBytes = 0;

          res.on("data", (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (receivedBytes > MAX_ARCHIVE_BYTES) {
              res.destroy(new Error("Template archive is unexpectedly large"));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        }
      )
      .on("error", reject);
  });
}

function fetchTemplateArchive(): Promise<AdmZip> {
  archivePromise ??= fetchBuffer(TEMPLATE_ARCHIVE_URL).then(
    (archive) => new AdmZip(archive)
  );
  return archivePromise;
}

function repositoryPath(entry: IZipEntry): string {
  const rootSeparator = entry.entryName.indexOf("/");
  return rootSeparator === -1
    ? ""
    : entry.entryName.slice(rootSeparator + 1);
}

function templateDirectories(entries: IZipEntry[]): string[] {
  const directories = entries
    .map(repositoryPath)
    .filter(
      (entryPath) =>
        entryPath.startsWith("typescript/") &&
        (entryPath.endsWith("/index.ts") ||
          entryPath.endsWith("/package.json"))
    )
    .map((entryPath) => entryPath.slice(0, entryPath.lastIndexOf("/")));

  return [...new Set(directories)];
}

export function resolveTemplatePath(
  templateDirs: string[],
  name: string
): string | undefined {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return undefined;
  }

  const directPath = `typescript/${name}`;
  if (templateDirs.includes(directPath)) {
    return directPath;
  }

  const nestedMatches = templateDirs.filter(
    (templateDir) => templateDir.split("/").at(-1) === name
  );

  if (nestedMatches.length > 1) {
    throw new Error(
      `Template '${name}' is ambiguous: ${nestedMatches.join(", ")}`
    );
  }

  return nestedMatches[0];
}

export async function fetchTypeScriptTemplates(): Promise<TemplateInfo[]> {
  const archive = await fetchTemplateArchive();
  const templateDirs = templateDirectories(archive.getEntries());

  return templateDirs.map((templatePath) => ({
    name: templatePath.split("/").at(-1)!,
    path: templatePath,
  }));
}

export async function getTemplateByName(
  name: string
): Promise<TemplateInfo | undefined> {
  const archive = await fetchTemplateArchive();
  const templatePath = resolveTemplatePath(
    templateDirectories(archive.getEntries()),
    name
  );

  return templatePath ? { name, path: templatePath } : undefined;
}

export async function fetchAllTemplateContents(
  templateName: string
): Promise<Map<string, Buffer>> {
  const archive = await fetchTemplateArchive();
  const templatePath = resolveTemplatePath(
    templateDirectories(archive.getEntries()),
    templateName
  );

  if (!templatePath) {
    return new Map();
  }

  const prefix = `${templatePath}/`;
  const contents = new Map<string, Buffer>();

  for (const entry of archive.getEntries()) {
    const entryPath = repositoryPath(entry);
    if (entry.isDirectory || !entryPath.startsWith(prefix)) {
      continue;
    }

    const relativePath = entryPath.slice(prefix.length);
    if (
      !relativePath ||
      relativePath.startsWith("/") ||
      relativePath.split("/").includes("..")
    ) {
      throw new Error(`Unsafe template archive path: ${entryPath}`);
    }
    contents.set(relativePath, entry.getData());
  }

  return contents;
}

export async function getAvailableTemplates(): Promise<string[]> {
  const templates = await fetchTypeScriptTemplates();
  return [
    "basic",
    ...new Set(templates.map((template) => template.name).sort()),
  ];
}
