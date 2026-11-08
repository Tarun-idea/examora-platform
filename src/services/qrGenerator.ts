import QRCode from 'qrcode';

export interface CertificateQrDataInput {
  certificateNumber: string;
  studentName: string;
  studentRegId: string;
  section?: string;
  examTitle: string;
  subjectName?: string;
  scoreText: string;
  grade: string;
  issuedAt: string;
  institutionName?: string;
  verifiedAt?: string;
  verificationStatus?: string;
}

/**
 * Formats the structured verification payload encoded inside the certificate QR code.
 * Scanning the QR code with any smartphone displays the student's name, ID, section,
 * examination, score, merit grade, issue date, and verification/usage status.
 */
export function buildCertificateQrText(input: CertificateQrDataInput): string {
  const verifiedTimestamp =
    input.verifiedAt || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const statusLabel =
    input.verificationStatus ||
    `VERIFIED & ACTIVE CREDENTIAL (Used/Verified: ${verifiedTimestamp})`;

  const lines = [
    'PANIMALAR ENGINEERING COLLEGE - OFFICIAL CERTIFICATE VERIFICATION',
    `Institution: ${input.institutionName || 'Panimalar Engineering College'}`,
    'Department: Department of AI and Data Science',
    `Certificate Serial: ${input.certificateNumber}`,
    `Student Name: ${input.studentName}`,
    `Student ID: ${input.studentRegId}`,
    `Section: ${input.section || 'Section A'}`,
    `Examination: ${input.examTitle}${input.subjectName ? ` (${input.subjectName})` : ''}`,
    `Verified Score: ${input.scoreText}`,
    `Merit Grade: ${input.grade}`,
    `Issue Date: ${input.issuedAt}`,
    `Verification Status: ${statusLabel}`,
  ];

  return lines.join('\n');
}

/**
 * Generates a Base64 PNG Data URL (`data:image/png;base64,...`) for the student certificate QR code.
 */
export async function generateCertificateQrBase64(
  input: CertificateQrDataInput,
  sizeOrColor: number | string = '#064E3B'
): Promise<string> {
  const qrText = buildCertificateQrText(input);
  const width = typeof sizeOrColor === 'number' ? sizeOrColor : 240;
  const darkColor = typeof sizeOrColor === 'string' ? sizeOrColor : '#064E3B';

  return QRCode.toDataURL(qrText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width,
    color: {
      dark: darkColor,
      light: '#FFFFFF',
    },
  });
}

/**
 * Alias for generateCertificateQrBase64 for compatibility across certificate views.
 */
export const generateCertificateQrDataUrl = generateCertificateQrBase64;

/**
 * Generates an HTMLCanvasElement containing the rendered QR code for drawing onto
 * high-resolution PNG and multi-page PDF certificate exports.
 */
export async function generateCertificateQrCanvas(
  input: CertificateQrDataInput,
  sizeOrColor: number | string = '#064E3B'
): Promise<HTMLCanvasElement> {
  const qrText = buildCertificateQrText(input);
  const width = typeof sizeOrColor === 'number' ? sizeOrColor : 240;
  const darkColor = typeof sizeOrColor === 'string' ? sizeOrColor : '#064E3B';
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width,
    color: {
      dark: darkColor,
      light: '#FFFFFF',
    },
  });
  return qrCanvas;
}
