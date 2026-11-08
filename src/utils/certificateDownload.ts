import {
  CertificateRecord,
  CertificateTemplateConfig,
} from '../services/examStore.ts';
import { generateCertificateQrCanvas } from '../services/qrGenerator.ts';

export interface PrintableCertificatePayload {
  certificateNumber: string;
  studentName: string;
  studentRegId: string;
  section?: string;
  examTitle: string;
  subjectName: string;
  scoreText: string;
  grade: string;
  issuedAt: string;
  verifiedAt?: string;
  remarks?: string;
}

const DEFAULT_CREST_URL = '/assets/panimalar-crest.png';

let preloadedCrestImg: HTMLImageElement | null = null;
if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  preloadedCrestImg = new Image();
  preloadedCrestImg.crossOrigin = 'anonymous';
  preloadedCrestImg.src = DEFAULT_CREST_URL;
}

function getCrestImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    if (
      preloadedCrestImg &&
      preloadedCrestImg.complete &&
      preloadedCrestImg.naturalWidth > 0
    ) {
      resolve(preloadedCrestImg);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      preloadedCrestImg = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = DEFAULT_CREST_URL;
  });
}

function renderCertificateToCanvas(
  template: CertificateTemplateConfig,
  payload: PrintableCertificatePayload,
  crestImg: HTMLImageElement | null,
  qrCanvas: HTMLCanvasElement | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const palette = {
      blue: {
        primary: '#1D4ED8',
        dark: '#0A1D56',
        lightBg: '#EFF6FF',
        borderOuter: '#93C5FD',
        borderInner: '#DBEAFE',
      },
      amber: {
        primary: '#B45309',
        dark: '#451A03',
        lightBg: '#FFFBEB',
        borderOuter: '#FCD34D',
        borderInner: '#FEF3C7',
      },
      emerald: {
        primary: '#047857',
        dark: '#064E3B',
        lightBg: '#ECFDF5',
        borderOuter: '#6EE7B7',
        borderInner: '#D1FAE5',
      },
      indigo: {
        primary: '#4338CA',
        dark: '#1E1B4B',
        lightBg: '#EEF2FF',
        borderOuter: '#A5B4FC',
        borderInner: '#E0E7FF',
      },
    }[template.accentTheme || 'emerald'];

    // 1. White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle top gradient wash
    const grad = ctx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, palette.lightBg);
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    // 3. Outer Border
    ctx.strokeStyle = palette.borderOuter;
    ctx.lineWidth = 8;
    ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);

    // 4. Inner Ornamental Border
    ctx.strokeStyle = palette.borderInner;
    ctx.lineWidth = 4;
    ctx.strokeRect(68, 68, canvas.width - 136, canvas.height - 136);

    // 4b. Large Centered Institutional Crest Watermark in Background
    if (crestImg) {
      const wmHeight = 720;
      const wmWidth = Math.round(
        wmHeight * (crestImg.naturalWidth / crestImg.naturalHeight)
      );
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.drawImage(
        crestImg,
        (canvas.width - wmWidth) / 2,
        165,
        wmWidth,
        wmHeight
      );
      ctx.restore();
    }

    // 5. Top-Left Official Panimalar Engineering College Full Banner Logo
    const tlX = 104;
    const tlY = 96;
    if (crestImg) {
      const crestH = 108;
      const crestW = Math.round(
        crestH * (crestImg.naturalWidth / crestImg.naturalHeight)
      );
      ctx.drawImage(crestImg, tlX, tlY, crestW, crestH);
    }

    const bannerTextCenterX = tlX + 232;
    ctx.save();
    ctx.textAlign = 'center';

    // "PANIMALAR"
    ctx.fillStyle = '#1E293B';
    ctx.font = '900 28px Inter, Arial, sans-serif';
    ctx.fillText('PANIMALAR', bannerTextCenterX, tlY + 26);

    // "ENGINEERING COLLEGE"
    ctx.fillStyle = '#334155';
    ctx.font = '800 17px Inter, Arial, sans-serif';
    ctx.fillText('ENGINEERING COLLEGE', bannerTextCenterX, tlY + 47);

    // Red Pill "An Autonomous Institution"
    const autoBadgeW = 204;
    const autoBadgeH = 22;
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.roundRect(
      bannerTextCenterX - autoBadgeW / 2,
      tlY + 53,
      autoBadgeW,
      autoBadgeH,
      4
    );
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12.5px Inter, Arial, sans-serif';
    ctx.fillText('An Autonomous Institution', bannerTextCenterX, tlY + 68.5);

    // "Affiliated to Anna University, Chennai"
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px Inter, Arial, sans-serif';
    ctx.fillText(
      'Affiliated to Anna University, Chennai',
      bannerTextCenterX,
      tlY + 88
    );

    // "(JAISAKTHI EDUCATIONAL TRUST)"
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px Inter, Arial, sans-serif';
    ctx.fillText(
      '(JAISAKTHI EDUCATIONAL TRUST)',
      bannerTextCenterX,
      tlY + 104
    );
    ctx.restore();

    ctx.textAlign = 'center';

    // 6. Top-Center Header Badge Pill ("OFFICIAL ACADEMIC CREDENTIAL")
    // Note: Small centered logo below this pill is intentionally omitted per layout specification
    const badgeText = (
      template.headerBadgeText || 'OFFICIAL ACADEMIC CREDENTIAL'
    ).toUpperCase();
    ctx.font = 'bold 17px Inter, system-ui, sans-serif';
    const badgeWidth = Math.max(360, ctx.measureText(badgeText).width + 64);
    ctx.fillStyle = palette.lightBg;
    ctx.strokeStyle = palette.borderOuter;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect((canvas.width - badgeWidth) / 2, 108, badgeWidth, 42, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.primary;
    ctx.fillText(badgeText, canvas.width / 2, 135);

    // 7. Institution Name (Centered above Certificate Title)
    ctx.fillStyle = palette.primary;
    ctx.font = 'bold 23px Inter, system-ui, sans-serif';
    ctx.fillText(
      (template.institutionName || 'PANIMALAR ENGINEERING COLLEGE').toUpperCase(),
      canvas.width / 2,
      276
    );

    // 8. Certificate Main Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 52px Inter, Georgia, serif';
    ctx.fillText(
      template.certificateTitle || 'Certificate of Examination Excellence',
      canvas.width / 2,
      340
    );

    // 9. Presentation Line
    ctx.fillStyle = '#64748B';
    ctx.font = '23px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.presentationLine || 'This is to officially certify that',
      canvas.width / 2,
      394
    );

    // 10. Candidate Full Name
    ctx.fillStyle = palette.dark;
    ctx.font = 'bold 54px Inter, Georgia, serif';
    ctx.fillText(payload.studentName, canvas.width / 2, 468);

    // Underline under Candidate Name
    const nameWidth = Math.min(
      900,
      Math.max(380, ctx.measureText(payload.studentName).width + 40)
    );
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo((canvas.width - nameWidth) / 2, 486);
    ctx.lineTo((canvas.width + nameWidth) / 2, 486);
    ctx.stroke();

    // 11. Citation Paragraph Lines
    ctx.fillStyle = '#334155';
    ctx.font = '23px Inter, system-ui, sans-serif';
    const line1 = `Registration ID: ${payload.studentRegId}  •  Examination: ${payload.examTitle}`;
    ctx.fillText(line1, canvas.width / 2, 542);

    ctx.font = '21px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#475569';
    const bodyStr =
      template.bodyTextTemplate ||
      'has successfully passed the proctored assessment with verified distinction.';
    ctx.fillText(
      bodyStr.length > 105 ? bodyStr.slice(0, 102) + '...' : bodyStr,
      canvas.width / 2,
      588
    );

    // 12. Score & Merit Grade Highlight
    ctx.font = 'bold 26px JetBrains Mono, monospace';
    ctx.fillStyle = palette.primary;
    ctx.fillText(
      `Verified Score: ${payload.scoreText}   |   Merit Grade: ${payload.grade}`,
      canvas.width / 2,
      644
    );

    // 13. Remarks Quote
    if (payload.remarks) {
      ctx.font = 'italic 20px Inter, Georgia, serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`"${payload.remarks}"`, canvas.width / 2, 694);
    }

    // 14. Divider Line above 3-Column Signatories Row
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 742);
    ctx.lineTo(canvas.width - 140, 742);
    ctx.stroke();

    // 15. Left Signatory
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillText(template.signatoryLeftName || 'Mrs. C. Annapoorani', 150, 792);
    ctx.fillStyle = '#64748B';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.signatoryLeftTitle || 'Faculty Mentor, Dept. of AI & DS',
      150,
      820
    );

    // 16. Center Signatory (Replaces old center seal box per layout image)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.signatoryCenterName ||
        template.signatoryLeftName ||
        'Dr. S. Prasanna Devi',
      canvas.width / 2,
      792
    );
    ctx.fillStyle = '#64748B';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.signatoryCenterTitle ||
        template.signatoryLeftTitle ||
        'Chief Examination Controller',
      canvas.width / 2,
      820
    );

    // 17. Right Signatory
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.signatoryRightName || 'Head of Department',
      canvas.width - 150,
      792
    );
    ctx.fillStyle = '#64748B';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(
      template.signatoryRightTitle || 'Department of AI and Data Science',
      canvas.width - 150,
      820
    );

    // 18. Bottom Row:
    //   - Bottom-Left: [ ✓ VERIFIED MERIT SEAL ] rounded box
    //   - Bottom-Center-Left (right next to seal): Scannable QR Code with Student & Usage Details
    //   - Bottom-Right: Issued Date • Verified Official Credential (+ Certificate Serial)
    const sealBoxX = 150;
    const sealBoxY = 890;
    const sealBoxW = 340;
    const sealBoxH = 82;
    const sealLabel = (template.sealText || 'VERIFIED MERIT SEAL').toUpperCase();

    ctx.fillStyle = palette.lightBg;
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sealBoxX, sealBoxY, sealBoxW, sealBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = palette.primary;
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillText(
      `✓ ${sealLabel}`,
      sealBoxX + sealBoxW / 2,
      sealBoxY + sealBoxH / 2 + 7
    );

    // Scannable QR Code Box right next to Verified Merit Seal
    const qrBoxX = 528;
    const qrBoxY = 863;
    const qrBoxSize = 136;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12);
    ctx.fill();
    ctx.stroke();

    if (qrCanvas) {
      ctx.drawImage(
        qrCanvas,
        qrBoxX + 8,
        qrBoxY + 8,
        qrBoxSize - 16,
        qrBoxSize - 16
      );
    }

    // Bottom-Right Issued Metadata
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '18px JetBrains Mono, monospace';
    ctx.fillText(
      `Issued: ${payload.issuedAt}  •  Verified Official Credential`,
      canvas.width - 150,
      938
    );
  }

  return canvas;
}

/**
 * Generates a high-resolution (1600x1120) official certificate PNG using HTML5 Canvas
 * and triggers an immediate browser download.
 */
export async function downloadAndPrintCertificate(
  template: CertificateTemplateConfig,
  payload: PrintableCertificatePayload
): Promise<void> {
  try {
    const [crestImg, qrCanvas] = await Promise.all([
      getCrestImage(),
      generateCertificateQrCanvas(
        {
          certificateNumber: payload.certificateNumber,
          studentName: payload.studentName,
          studentRegId: payload.studentRegId,
          section: payload.section || 'Section A',
          examTitle: payload.examTitle,
          subjectName: payload.subjectName,
          scoreText: payload.scoreText,
          grade: payload.grade,
          issuedAt: payload.issuedAt,
          verifiedAt: payload.verifiedAt || payload.issuedAt,
          institutionName:
            template.institutionName || 'Panimalar Engineering College',
        },
        240
      ),
    ]);
    const canvas = renderCertificateToCanvas(
      template,
      payload,
      crestImg,
      qrCanvas
    );

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const cleanName = payload.studentName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    link.download = `Certificate_${payload.certificateNumber}_${cleanName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Fallback if canvas fails
  }
}

export async function downloadCertificateRecord(
  template: CertificateTemplateConfig,
  cert: CertificateRecord,
  sectionLabel?: string
): Promise<void> {
  await downloadAndPrintCertificate(template, {
    certificateNumber: cert.certificateNumber,
    studentName: cert.studentName,
    studentRegId: cert.studentRegId,
    section: sectionLabel || cert.section || 'Section A',
    examTitle: cert.examTitle,
    subjectName: cert.subjectName,
    scoreText: `${cert.score} / ${cert.maxScore} (${cert.percentage}%)`,
    grade: cert.grade,
    issuedAt: cert.issuedAt,
    verifiedAt: cert.verifiedAt || cert.issuedAt,
    remarks:
      cert.customRemarks ||
      'Awarded for passing the proctored examination with verified distinction.',
  });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Packs multiple 1600x1120 JPEG certificate images into a single standards-compliant
 * multi-page landscape PDF document (1 certificate per page).
 */
function buildMultiPagePdfFromJpegs(
  jpegPages: Uint8Array[],
  imgWidthPx = 1600,
  imgHeightPx = 1120
): Blob {
  const pageWidthPt = 842; // A4 Landscape width in points
  const pageHeightPt = 595; // A4 Landscape height in points
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // 1-indexed object offsets
  let currentOffset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  // PDF Header (with binary comment marker)
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const numPages = jpegPages.length;
  // Object numbering:
  // 1: Catalog
  // 2: Pages
  // For each page i (0 .. numPages - 1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const totalObjects = 2 + numPages * 3;

  // Object 1: Catalog
  offsets[1] = currentOffset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  const kidsRefs = Array.from(
    { length: numPages },
    (_, i) => `${3 + i * 3} 0 R`
  ).join(' ');
  offsets[2] = currentOffset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${numPages} >>\nendobj\n`
  );

  // Page, Content Stream, and Image XObject for each certificate
  for (let i = 0; i < numPages; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const jpegBytes = jpegPages[i];

    // Page Object
    offsets[pageObjId] = currentOffset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /Im${i} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content Stream (scales the 1600x1120 certificate across the landscape PDF page)
    const contentStream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im${i} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = currentOffset;
    pushStr(
      `${contentObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`
    );
    pushBytes(contentBytes);
    pushStr('\nendstream\nendobj\n');

    // Image XObject (DCTDecode raw JPEG)
    offsets[imageObjId] = currentOffset;
    pushStr(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');
  }

  // Cross-Reference Table (xref)
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let objId = 1; objId <= totalObjects; objId++) {
    const paddedOffset = String(offsets[objId] || 0).padStart(10, '0');
    pushStr(`${paddedOffset} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
}

/**
 * Renders all passed student certificates for a selected section (or all sections)
 * and downloads them in ONE combined multi-page PDF document.
 */
export async function downloadBatchCertificates(
  template: CertificateTemplateConfig,
  certs: CertificateRecord[],
  onProgress?: (current: number, total: number) => void,
  sectionLabel = 'All_Sections'
): Promise<number> {
  if (certs.length === 0) return 0;
  const crestImg = await getCrestImage();
  const jpegPages: Uint8Array[] = [];
  const total = certs.length;

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);
    const cert = certs[i];
    const scoreText = `${cert.score} / ${cert.maxScore} (${cert.percentage}%)`;
    const qrCanvas = await generateCertificateQrCanvas(
      {
        certificateNumber: cert.certificateNumber,
        studentName: cert.studentName,
        studentRegId: cert.studentRegId,
        section: cert.section || sectionLabel.replace('_', ' '),
        examTitle: cert.examTitle,
        subjectName: cert.subjectName,
        scoreText,
        grade: cert.grade,
        issuedAt: cert.issuedAt,
        verifiedAt: cert.verifiedAt || cert.issuedAt,
        institutionName:
          template.institutionName || 'Panimalar Engineering College',
      },
      240
    );
    const canvas = renderCertificateToCanvas(
      template,
      {
        certificateNumber: cert.certificateNumber,
        studentName: cert.studentName,
        studentRegId: cert.studentRegId,
        section: cert.section || sectionLabel.replace('_', ' '),
        examTitle: cert.examTitle,
        subjectName: cert.subjectName,
        scoreText,
        grade: cert.grade,
        issuedAt: cert.issuedAt,
        verifiedAt: cert.verifiedAt || cert.issuedAt,
        remarks:
          cert.customRemarks ||
          'Awarded for passing the proctored examination with verified distinction.',
      },
      crestImg,
      qrCanvas
    );
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
    jpegPages.push(dataUrlToUint8Array(jpegDataUrl));
    // Yield briefly so the UI progress indicator updates smoothly
    await new Promise((res) => setTimeout(res, 25));
  }

  const pdfBlob = buildMultiPagePdfFromJpegs(jpegPages, 1600, 1120);
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const cleanSection = sectionLabel
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const link = document.createElement('a');
  link.download = `Certificates_${cleanSection}_${total}_Passed_Students.pdf`;
  link.href = pdfUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);

  return total;
}


