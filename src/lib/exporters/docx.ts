import { saveAs } from 'file-saver';

export async function exportDocx(text: string, filename: string): Promise<void> {
  const blob = await buildDocxBlob(text);
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

export async function buildDocxBlob(text: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphs = text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph({})],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
