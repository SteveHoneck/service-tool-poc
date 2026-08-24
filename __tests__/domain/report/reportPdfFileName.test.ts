import { reportPdfFileName } from '../../../src/domain/report/reportPdfFileName';

describe('reportPdfFileName', () => {
  it('turns the list label into a hyphenated pdf name', () => {
    expect(reportPdfFileName({ jobName: 'Leak check' })).toBe('Leak-check.pdf');
  });

  it('uses Untitled-report.pdf when the job name is blank', () => {
    expect(reportPdfFileName({ jobName: '' })).toBe('Untitled-report.pdf');
  });

  it('strips characters that are not letters or digits', () => {
    expect(reportPdfFileName({ jobName: 'Leak <check> & more' })).toBe(
      'Leak-check-more.pdf',
    );
  });

  it('does not keep path separators from the job name', () => {
    expect(reportPdfFileName({ jobName: '../../etc/passwd' })).toBe(
      'etc-passwd.pdf',
    );
  });
});
