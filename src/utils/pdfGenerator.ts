/**
 * Pure TypeScript minimal valid PDF 1.4 generator.
 * Produces real, offline-downloadable & viewable binary PDF documents
 * without any external dependencies or network requests.
 */

function escapePdfText(input: string): string {
  // Replace non-ASCII characters cleanly for standard Helvetica Type1 PDF font
  const asciiSafe = input.replace(/[^\x20-\x7E]/g, (ch) => {
    const map: Record<string, string> = {
      '–': '-',
      '—': '-',
      '’': "'",
      '‘': "'",
      '“': '"',
      '”': '"',
      '×': 'x',
      '÷': '/',
      '°': ' deg',
      '²': '^2',
      '³': '^3',
      '√': 'sqrt',
      'π': 'pi',
      'Ω': 'Ohm',
      'θ': 'theta',
      'α': 'alpha',
      'β': 'beta',
      '→': '->',
      '⇌': '<=>',
    };
    return map[ch] ?? ' ';
  });
  return asciiSafe
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(text: string, maxChars = 78): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  }
  if (current) lines.push(current.trim());
  return lines.length > 0 ? lines : [''];
}

export interface PdfNoteDocumentInput {
  title: string;
  subtitle: string;
  instructor: string;
  sections: { heading: string; body: string; formula?: string }[];
}

export function buildPdfBytes(doc: PdfNoteDocumentInput): Uint8Array {
  const lines: { text: string; size: number; bold?: boolean; gap?: number }[] = [
    { text: 'PRAGATIR PATHSHALA - OFFLINE STUDY NOTES', size: 10, bold: true, gap: 16 },
    { text: doc.title, size: 16, bold: true, gap: 22 },
    { text: doc.subtitle, size: 11, gap: 16 },
    { text: `Educator: ${doc.instructor}`, size: 10, gap: 22 },
    { text: '--------------------------------------------------------------------------', size: 10, gap: 16 },
  ];

  for (const section of doc.sections) {
    lines.push({ text: section.heading, size: 13, bold: true, gap: 18 });
    for (const wrapped of wrapLine(section.body, 80)) {
      lines.push({ text: wrapped, size: 10.5, gap: 14 });
    }
    if (section.formula) {
      lines.push({ text: `Formula / Key Rule: ${section.formula}`, size: 10.5, bold: true, gap: 18 });
    }
    lines.push({ text: '', size: 10, gap: 8 });
  }

  // Paginate lines (y starts at 750 down to 60)
  const pages: string[][] = [];
  let currentCommands: string[] = [];
  let y = 755;

  for (const item of lines) {
    const gap = item.gap ?? 14;
    if (y - gap < 60) {
      pages.push(currentCommands);
      currentCommands = [];
      y = 755;
    }
    const fontRef = item.bold ? '/F2' : '/F1';
    const safe = escapePdfText(item.text);
    currentCommands.push(`BT ${fontRef} ${item.size} Tf 52 ${y} Td (${safe}) Tj ET`);
    y -= gap;
  }
  if (currentCommands.length > 0 || pages.length === 0) {
    pages.push(currentCommands);
  }

  // Build PDF objects
  const objects: string[] = [];
  const pageCount = pages.length;
  // Object 1: Catalog
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  // Object 2: Pages (kids start at 5)
  const kidRefs = pages.map((_, idx) => `${5 + idx * 2} 0 R`).join(' ');
  objects.push(`2 0 obj << /Type /Pages /Kids [ ${kidRefs} ] /Count ${pageCount} >> endobj`);
  // Object 3: Font Regular
  objects.push('3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');
  // Object 4: Font Bold
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj');

  pages.forEach((cmds, idx) => {
    const pageObjId = 5 + idx * 2;
    const contentObjId = pageObjId + 1;
    const footerCmd = `BT /F1 8.5 Tf 52 34 Td (Pragatir Pathshala Offline Archive - Page ${idx + 1} of ${pageCount}) Tj ET`;
    const streamStr = [...cmds, footerCmd].join('\n');
    objects.push(
      `${pageObjId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >> endobj`
    );
    objects.push(
      `${contentObjId} 0 obj << /Length ${streamStr.length} >> stream\n${streamStr}\nendstream endobj`
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}
