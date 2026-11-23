import { env } from '../config/env.js';

/**
 * Splits extracted document text into overlapping semantic chunks while preserving
 * section headings and paragraph boundaries.
 */
export function chunkText(
  rawText,
  { chunkSize = env.ragChunkSize, chunkOverlap = env.ragChunkOverlap, metadata = {} } = {}
) {
  const normalized = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';
  let currentHeading = null;

  const pushBuffer = (text) => {
    const clean = text.trim();
    if (!clean) return;
    chunks.push({
      chunk_index: chunks.length,
      content: clean,
      token_estimate: Math.ceil(clean.length / 4),
      metadata: {
        ...metadata,
        heading: currentHeading,
        char_length: clean.length,
      },
    });
  };

  for (const para of paragraphs) {
    if (para.length <= 90 && !para.endsWith('.') && /^[0-9A-Z\u0B80-\u0BFF]/.test(para)) {
      currentHeading = para;
    }

    if (buffer.length + para.length + 2 <= chunkSize) {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
      continue;
    }

    if (buffer) {
      pushBuffer(buffer);
      const overlapSlice = buffer.slice(Math.max(0, buffer.length - chunkOverlap)).trim();
      buffer = overlapSlice ? `${overlapSlice}\n\n${para}` : para;
    } else {
      buffer = para;
    }

    while (buffer.length > chunkSize * 1.25) {
      let splitAt = buffer.lastIndexOf('. ', chunkSize);
      if (splitAt < chunkSize * 0.4) {
        splitAt = buffer.lastIndexOf(' ', chunkSize);
      }
      if (splitAt < chunkSize * 0.3) {
        splitAt = chunkSize;
      }
      const head = buffer.slice(0, splitAt + 1);
      pushBuffer(head);
      const nextStart = Math.max(0, splitAt + 1 - chunkOverlap);
      buffer = buffer.slice(nextStart).trim();
    }
  }

  if (buffer.trim()) {
    pushBuffer(buffer);
  }

  return chunks;
}
