import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';

function pdfBaseName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '');
}

function fileUrl(filePath: string): string {
  return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
}

export async function generateReportPdf(
  html: string,
  fileName: string,
): Promise<{ filePath: string }> {
  const result = await generatePDF({
    html,
    fileName: pdfBaseName(fileName),
  });

  if (!result.filePath) {
    throw new Error('PDF generation did not return a file path');
  }

  return { filePath: result.filePath };
}

export async function sharePdf(filePath: string): Promise<void> {
  await Share.open({
    url: fileUrl(filePath),
    type: 'application/pdf',
    failOnCancel: false,
  });
}

export async function shareReportPdf(
  html: string,
  fileName: string,
): Promise<void> {
  const { filePath } = await generateReportPdf(html, fileName);
  await sharePdf(filePath);
}
