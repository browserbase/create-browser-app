import AdmZip, { IZipEntry } from "adm-zip";

interface TemplateInfo {
  name: string;
  path: string;
}

const TEMPLATE_ARCHIVE_URL =
  "https://codeload.github.com/browserbase/templates/zip/refs/heads/dev";
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

let archivePromise: Promise<AdmZip> | undefined;

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": "create-browser-app" },
  });

  if (!response.ok) {
    throw new Error(
      `Template archive request failed with HTTP ${response.status}`
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ARCHIVE_BYTES) {
    await response.body?.cancel();
    throw new Error("Template archive is unexpectedly large");
  }

  if (!response.body) {
    throw new Error("Template archive response has no body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return Buffer.concat(chunks, receivedBytes);
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_ARCHIVE_BYTES) {
      await reader.cancel();
      throw new Error("Template archive is unexpectedly large");
    }
    chunks.push(value);
  }
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
