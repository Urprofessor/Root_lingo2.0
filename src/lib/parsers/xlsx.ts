export async function parseXlsx(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const allText: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    allText.push(`# ${sheetName}\n`);
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
    allText.push(csv);
    allText.push('\n');
  }
  return allText.join('\n');
}
