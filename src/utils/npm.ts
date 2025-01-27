interface NpmRegistryResponse {
  "dist-tags": {
    latest: string;
    [key: string]: string;
  };
}

/**
 * Gets the latest version of a package from npm
 * @param packageName The name of the package to get the latest version for
 * @returns Promise that resolves to the latest version string
 */
export async function getLatestNpmVersion(
  packageName: string
): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch package info: ${response.statusText}`);
    }
    const data = (await response.json()) as NpmRegistryResponse;
    return data["dist-tags"].latest;
  } catch (error) {
    throw new Error(
      `Error getting latest version for ${packageName}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
