import fs from 'node:fs';
import zlib from 'node:zlib';

/**
 * Extracts readable text from PDF, DOCX, TXT, and MD documents.
 * Uses `pdf-parse` / `mammoth` when installed, with resilient pure-Node fallbacks
 * for DOCX (ZIP + word/document.xml) and PDF text streams.
 */

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Pure-Node ZIP entry reader to extract `word/document.xml` from a DOCX buffer without external packages.
 */
function extractDocxXmlFallback(buffer) {
  const signature = 0x04034b50; // Local file header signature PK\x03\x04
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== signature) {
      offset += 1;
      continue;
    }
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const fileNameStart = offset + 30;
    const fileName = buffer.toString('utf8', fileNameStart, fileNameStart + fileNameLen);
    const dataStart = fileNameStart + fileNameLen + extraLen;

    if (fileName === 'word/document.xml') {
      let xmlBuf;
      if (compressionMethod === 0) {
        xmlBuf = buffer.subarray(dataStart, dataStart + compressedSize);
      } else if (compressionMethod === 8) {
        // Deflate raw; if compressedSize is 0 (data descriptor bit set), scan to next PK signature
        let sliceEnd = compressedSize > 0 ? dataStart + compressedSize : buffer.length;
        if (compressedSize === 0) {
          const nextPk = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x07, 0x08]), dataStart);
          if (nextPk !== -1) sliceEnd = nextPk;
        }
        xmlBuf = zlib.inflateRawSync(buffer.subarray(dataStart, sliceEnd));
      } else {
        throw new Error(`Unsupported DOCX compression method: ${compressionMethod}`);
      }

      const xml = xmlBuf.toString('utf8');
      const text = xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, ' ')
        .replace(/<w:br\/>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map((line) => decodeXmlEntities(line).trim())
        .filter(Boolean)
        .join('\n');
      return text;
    }

    offset = dataStart + (compressedSize || 1);
  }
  throw new Error('Could not locate word/document.xml inside DOCX archive.');
}

/**
 * Pure-Node fallback PDF text extractor for uncompressed & FlateDecode text streams.
 */
function extractPdfFallback(buffer) {
  const raw = buffer.toString('latin1');
  const extracted = [];

  const extractStringsFromContent = (content) => {
    // Match (...) Tj and [(...)] TJ operators
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
    let m;
    while ((m = tjRegex.exec(content)) !== null) {
      extracted.push(
        m[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
      );
    }

    const tjArrRegex = /\[(.*?)\]\s*TJ/gs;
    while ((m = tjArrRegex.exec(content)) !== null) {
      const inner = m[1];
      const parts = [];
      const strRe = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
      let sm;
      while ((sm = strRe.exec(inner)) !== null) {
        parts.push(
          sm[1]
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
        );
      }
      if (parts.length) extracted.push(parts.join(''));
    }
  };

  // Scan stream ... endstream blocks
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRe.exec(raw)) !== null) {
    const streamData = match[1];
    const streamBuf = Buffer.from(streamData, 'latin1');
    let decoded = streamData;
    try {
      decoded = zlib.inflateSync(streamBuf).toString('latin1');
    } catch {
      // Not FlateDecode compressed, use raw stream text
    }
    extractStringsFromContent(decoded);
  }

  // Also scan top-level content in case PDF has direct text operators
  if (extracted.length === 0) {
    extractStringsFromContent(raw);
  }

  return extracted
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractDocumentText(filePath, fileType) {
  const buffer = fs.readFileSync(filePath);
  const type = (fileType || '').toLowerCase();

  if (type === 'txt' || type === 'md') {
    return buffer.toString('utf8').trim();
  }

  if (type === 'docx') {
    try {
      const mammoth = await import('mammoth');
      const result = await (mammoth.default || mammoth).extractRawText({ buffer });
      if (result?.value?.trim()) return result.value.trim();
    } catch {
      // Fallback to pure-Node ZIP/XML DOCX parser
    }
    return extractDocxXmlFallback(buffer);
  }

  if (type === 'pdf') {
    try {
      const pdfParseMod = await import('pdf-parse');
      const pdfParse = pdfParseMod.default || pdfParseMod;
      const result = await pdfParse(buffer);
      if (result?.text?.trim()) return result.text.trim();
    } catch {
      // Fallback to pure-Node PDF text extractor
    }
    const fallbackText = extractPdfFallback(buffer);
    if (!fallbackText) {
      throw new Error(
        'No extractable text found in PDF. If this is a scanned image PDF, please run OCR or upload a text-selectable PDF/DOCX.'
      );
    }
    return fallbackText;
  }

  throw new Error(`Unsupported document type: ${fileType}`);
}
