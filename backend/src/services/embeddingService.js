import { env, isOpenAiConfigured } from '../config/env.js';

const LOCAL_VECTOR_DIM = 256;

// Common bilingual English <-> Tamil college synonym expansion for local semantic vectors
const SYNONYM_GROUPS = [
  ['admission', 'admissions', 'apply', 'application', 'tnea', 'counselling', 'join', 'சேர்க்கை', 'அட்மிஷன்', 'விண்ணப்பம்'],
  ['course', 'courses', 'programme', 'programmes', 'program', 'degree', 'be', 'btech', 'me', 'படிப்பு', 'படிப்புகள்', 'பாடப்பிரிவு'],
  ['department', 'departments', 'branch', 'branches', 'cse', 'aids', 'ece', 'eee', 'mech', 'civil', 'it', 'துறை', 'துறைகள்'],
  ['placement', 'placements', 'job', 'jobs', 'recruit', 'recruitment', 'company', 'internship', 'career', 'வேலைவாய்ப்பு', 'பயிற்சி'],
  ['fee', 'fees', 'tuition', 'scholarship', 'scholarships', 'cost', 'கட்டணம்', 'உதவித்தொகை'],
  ['hostel', 'transport', 'bus', 'library', 'lab', 'labs', 'laboratory', 'facility', 'facilities', 'campus', 'விடுதி', 'பேருந்து', 'நூலகம்', 'வசதிகள்'],
  ['exam', 'examination', 'syllabus', 'regulation', 'regulations', 'internal', 'cia', 'academic', 'தேர்வு', 'பாடத்திட்டம்'],
  ['faculty', 'professor', 'teacher', 'staff', 'fdp', 'nptel', 'research', 'ஆசிரியர்', 'பேராசிரியர்'],
];

const SYNONYM_LOOKUP = new Map();
for (let g = 0; g < SYNONYM_GROUPS.length; g += 1) {
  for (const term of SYNONYM_GROUPS[g]) {
    SYNONYM_LOOKUP.set(term, `concept_${g}`);
  }
}

function fnv1aHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic, Unicode & Tamil-safe hashed n-gram + concept embedding vector
 * used when OPENAI_API_KEY is not configured (local/offline RAG mode).
 */
export function generateLocalEmbedding(text) {
  const vec = new Float64Array(LOCAL_VECTOR_DIM);
  const clean = (text || '').toLowerCase();
  const tokens = clean.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 2);

  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    const idx = fnv1aHash(tok) % LOCAL_VECTOR_DIM;
    vec[idx] += 1.0;

    // Semantic concept expansion (links Tamil & English college terminology)
    const concept = SYNONYM_LOOKUP.get(tok);
    if (concept) {
      const cIdx = fnv1aHash(concept) % LOCAL_VECTOR_DIM;
      vec[cIdx] += 1.8;
    }

    // Character trigram sub-features for morphological resilience
    if (tok.length >= 4) {
      for (let j = 0; j <= tok.length - 3; j += 1) {
        const tri = tok.slice(j, j + 3);
        const tIdx = fnv1aHash(`tri:${tri}`) % LOCAL_VECTOR_DIM;
        vec[tIdx] += 0.25;
      }
    }

    // Word bigrams
    if (i + 1 < tokens.length) {
      const bi = `${tok}_${tokens[i + 1]}`;
      const bIdx = fnv1aHash(`bi:${bi}`) % LOCAL_VECTOR_DIM;
      vec[bIdx] += 0.6;
    }
  }

  let norm = 0;
  for (let i = 0; i < LOCAL_VECTOR_DIM; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const normalized = new Array(LOCAL_VECTOR_DIM);
  for (let i = 0; i < LOCAL_VECTOR_DIM; i += 1) {
    normalized[i] = Number((vec[i] / norm).toFixed(6));
  }
  return normalized;
}

/**
 * Generates embeddings using OpenAI Embeddings API when OPENAI_API_KEY is configured,
 * falling back seamlessly to deterministic local semantic embeddings otherwise.
 */
export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  if (!isOpenAiConfigured()) {
    return texts.map((t) => generateLocalEmbedding(t));
  }

  try {
    const response = await fetch(`${env.openAiBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openAiEmbeddingModel,
        input: texts.map((t) => (t || '').slice(0, 8000)),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[EmbeddingService] OpenAI Embeddings error, falling back to local embeddings:', errText);
      return texts.map((t) => generateLocalEmbedding(t));
    }

    const data = await response.json();
    const sorted = (data.data || []).sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  } catch (err) {
    console.warn('[EmbeddingService] OpenAI network error, falling back to local embeddings:', err.message);
    return texts.map((t) => generateLocalEmbedding(t));
  }
}

export async function generateSingleEmbedding(text) {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}
