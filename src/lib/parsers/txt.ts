export async function parseTxt(file: File): Promise<string> {
  return await file.text();
}

export async function parseMarkdown(file: File): Promise<string> {
  return await file.text();
}
