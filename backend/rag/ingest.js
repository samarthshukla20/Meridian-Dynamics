import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   Clients
   ========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* =========================================================
   Configuration
   ========================================================= */

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "../knowledge");

/* =========================================================
   Embedding normalization
   ========================================================= */

function normalizeEmbedding(values) {
  if (!Array.isArray(values)) {
    throw new Error("Embedding values are missing.");
  }

  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} dimensions, received ${values.length}.`
    );
  }

  let magnitude = 0;

  for (const value of values) {
    magnitude += value * value;
  }

  magnitude = Math.sqrt(magnitude);

  if (!Number.isFinite(magnitude) || magnitude === 0) {
    throw new Error("Invalid embedding magnitude.");
  }

  return values.map((value) => value / magnitude);
}

/* =========================================================
   Generate DOCUMENT embedding
   ========================================================= */

async function getDocumentEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error("Cannot create embedding from empty text.");
  }

  const embeddingModel = genAI.getGenerativeModel({
    model: EMBEDDING_MODEL,
  });

  const result = await embeddingModel.embedContent({
    content: {
      parts: [{ text: text.trim() }],
    },
    outputDimensionality: EMBEDDING_DIMENSIONS,
    taskType: "RETRIEVAL_DOCUMENT",
  });

  return normalizeEmbedding(result?.embedding?.values);
}

/* =========================================================
   Document chunking
   ========================================================= */

function chunkDocument(content, maxChars = 800, overlap = 120) {
  if (!Number.isInteger(maxChars) || maxChars < 1) {
    throw new Error("maxChars must be a positive integer.");
  }

  if (!Number.isFinite(overlap) || overlap < 0) {
    throw new Error("overlap must be a non-negative number.");
  }

  const clean = String(content ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!clean) return [];

  // Split Markdown into paragraphs.
  const paragraphs = clean
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  function addChunk(value) {
    const trimmed = value.trim();

    if (trimmed) {
      chunks.push(trimmed);
    }
  }

  // Split long paragraphs by sentence first, then by word if needed.
  function splitLongParagraph(paragraph) {
    const sentences =
      paragraph.match(/[^.!?]+(?:[.!?]+["'’”)\]]*|$)/g) || [
        paragraph,
      ];

    const pieces = [];
    let buffer = "";

    function splitOversizedSentence(sentence) {
      const words = sentence.split(/\s+/).filter(Boolean);
      const segments = [];
      let segment = "";

      for (const word of words) {
        const candidate = segment ? `${segment} ${word}` : word;

        if (candidate.length <= maxChars) {
          segment = candidate;
        } else {
          if (segment) {
            segments.push(segment);
          }

          // An individual token such as a very long URL cannot
          // be split at a normal word boundary.
          segment = word;
        }
      }

      if (segment) {
        segments.push(segment);
      }

      return segments;
    }

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();

      if (!sentence) continue;

      if (sentence.length > maxChars) {
        if (buffer) {
          pieces.push(buffer);
          buffer = "";
        }

        pieces.push(...splitOversizedSentence(sentence));
        continue;
      }

      const candidate = buffer
        ? `${buffer} ${sentence}`
        : sentence;

      if (candidate.length <= maxChars) {
        buffer = candidate;
      } else {
        if (buffer) {
          pieces.push(buffer);
        }

        buffer = sentence;
      }
    }

    if (buffer) {
      pieces.push(buffer);
    }

    return pieces;
  }

  // Carry over complete sentences only, rather than arbitrary
  // characters that could cut words or sentences in half.
  function getSentenceOverlap(previousChunk) {
    if (overlap <= 0) return "";

    const sentences =
      previousChunk.match(/[^.!?]+(?:[.!?]+["'’”)\]]*|$)/g) || [];

    let tail = "";

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();

      if (!sentence) continue;

      const candidate = tail
        ? `${sentence} ${tail}`
        : sentence;

      if (
        candidate.length > overlap ||
        candidate.length >= maxChars
      ) {
        break;
      }

      tail = candidate;
    }

    return tail;
  }

  for (const paragraph of paragraphs) {
    const candidate = current
      ? `${current}\n\n${paragraph}`
      : paragraph;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      addChunk(current);

      const tail = getSentenceOverlap(current);
      current = tail;
    }

    const withOverlap = current
      ? `${current}\n\n${paragraph}`
      : paragraph;

    if (withOverlap.length <= maxChars) {
      current = withOverlap;
      continue;
    }

    const pieces = splitLongParagraph(paragraph);

    for (const piece of pieces) {
      const next = current
        ? `${current}\n\n${piece}`
        : piece;

      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) {
          addChunk(current);
        }

        current = piece;
      }

      if (current.length >= maxChars) {
        addChunk(current);
        current = "";
      }
    }
  }

  addChunk(current);

  return chunks.filter(Boolean);
}

/* =========================================================
   Ingest one Markdown file
   ========================================================= */

async function ingestFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  const {
    data: frontmatter,
    content,
  } = matter(raw);

  const source = path
    .relative(KNOWLEDGE_DIR, filePath)
    .split(path.sep)
    .join("/");

  console.log(`\n📄 Ingesting: ${source}`);

  /* Create or update document */

  const {
    data: document,
    error: documentError,
  } = await supabase
    .from("documents")
    .upsert(
      {
        source,
        category: frontmatter.category || "general",
        metadata: frontmatter,
      },
      {
        onConflict: "source",
      }
    )
    .select("id")
    .single();

  if (documentError) {
    throw new Error(
      `Document upsert failed (${source}): ${documentError.message}`
    );
  }

  /* Delete old chunks for this document */

  const {
    error: deleteError,
  } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", document.id);

  if (deleteError) {
    throw new Error(
      `Chunk cleanup failed (${source}): ${deleteError.message}`
    );
  }

  /* Create new chunks */

  const chunks = chunkDocument(content);

  console.log(`   → ${chunks.length} chunks created`);

  if (!chunks.length) {
    console.log(`   ⚠️ No content found in ${source}`);
    return;
  }

  /* Generate and insert embeddings */

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    console.log(
      `   → Embedding ${index + 1}/${chunks.length}`
    );

    const embedding = await getDocumentEmbedding(chunk);

    const {
      error: insertError,
    } = await supabase
      .from("document_chunks")
      .insert({
        document_id: document.id,
        content: chunk,
        metadata: {
          ...frontmatter,
          source,
          chunk_index: index,
        },
        embedding,
      });

    if (insertError) {
      throw new Error(
        `Chunk ${index} insert failed (${source}): ${insertError.message}`
      );
    }

    console.log(`      ✓ Stored chunk ${index + 1}`);
  }

  console.log(`   ✓ ${source} indexed successfully`);
}

/* =========================================================
   Recursively find Markdown files
   ========================================================= */

async function walkDirectory(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath);
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".md")
    ) {
      await ingestFile(fullPath);
    }
  }
}

/* =========================================================
   Environment validation
   ========================================================= */

function validateEnvironment() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "GEMINI_API_KEY",
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    throw new Error(
      `Knowledge directory not found: ${KNOWLEDGE_DIR}`
    );
  }
}

/* =========================================================
   Main
   ========================================================= */

async function run() {
  console.log("==========================================");
  console.log(" Meridian Dynamics — RAG Ingestion");
  console.log("==========================================");

  validateEnvironment();

  console.log(`Knowledge directory: ${KNOWLEDGE_DIR}`);

  await walkDirectory(KNOWLEDGE_DIR);

  console.log("\n✓ RAG ingestion completed successfully.");
}

/* =========================================================
   Error handling
   ========================================================= */

run().catch((error) => {
  console.error("\n✗ RAG ingestion failed:");
  console.error(error);

  process.exitCode = 1;
});