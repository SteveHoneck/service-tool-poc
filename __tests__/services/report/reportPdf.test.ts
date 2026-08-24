jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(),
}));
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {
  generateReportPdf,
  sharePdf,
  shareReportPdf,
} from '../../../src/services/report/reportPdf';

const generatePDFMock = generatePDF as jest.MockedFunction<typeof generatePDF>;
const shareOpenMock = Share.open as jest.MockedFunction<typeof Share.open>;

describe('services/report/reportPdf', () => {
  beforeEach(() => {
    generatePDFMock.mockReset();
    shareOpenMock.mockReset();
    generatePDFMock.mockResolvedValue({ filePath: '/cache/Leak-check.pdf' });
    shareOpenMock.mockResolvedValue({ success: true, message: 'OK' });
  });

  it('generateReportPdf writes HTML to the cache using the base file name', async () => {
    await expect(
      generateReportPdf('<p>Leak check</p>', 'Leak-check.pdf'),
    ).resolves.toEqual({ filePath: '/cache/Leak-check.pdf' });

    expect(generatePDFMock).toHaveBeenCalledWith({
      html: '<p>Leak check</p>',
      fileName: 'Leak-check',
    });
  });

  it('sharePdf opens the share sheet for a pdf file url', async () => {
    await sharePdf('/cache/Leak-check.pdf');

    expect(shareOpenMock).toHaveBeenCalledWith({
      url: 'file:///cache/Leak-check.pdf',
      type: 'application/pdf',
      failOnCancel: false,
    });
  });

  it('shareReportPdf shares the generated file path', async () => {
    await shareReportPdf('<p>Leak check</p>', 'Leak-check.pdf');

    expect(generatePDFMock).toHaveBeenCalledWith({
      html: '<p>Leak check</p>',
      fileName: 'Leak-check',
    });
    expect(shareOpenMock).toHaveBeenCalledWith({
      url: 'file:///cache/Leak-check.pdf',
      type: 'application/pdf',
      failOnCancel: false,
    });
  });

  it('shareReportPdf does not share when generate fails', async () => {
    generatePDFMock.mockRejectedValue(new Error('native pdf failed'));

    await expect(
      shareReportPdf('<p>Leak check</p>', 'Leak-check.pdf'),
    ).rejects.toThrow('native pdf failed');

    expect(shareOpenMock).not.toHaveBeenCalled();
  });
});
