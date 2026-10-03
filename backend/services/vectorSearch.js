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

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


/* =========================================================
   Configuration
   ========================================================= */

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;


/* =========================================================
   Normalize embedding
   ========================================================= */

function normalizeEmbedding(values) {

  if (!Array.isArray(values)) {
    throw new Error(
      "Embedding values are missing."
    );
  }

  if (
    values.length !==
    EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} dimensions, received ${values.length}.`
    );
  }

  let magnitude = 0;

  for (const value of values) {
    magnitude += value * value;
  }

  magnitude = Math.sqrt(magnitude);

  if (
    !Number.isFinite(magnitude) ||
    magnitude === 0
  ) {
    throw new Error(
      "Invalid embedding magnitude."
    );
  }

  return values.map(
    (value) => value / magnitude
  );
}


/* =========================================================
   Generate QUERY embedding
   ========================================================= */

export async function getQueryEmbedding(
  text
) {

  if (
    !text ||
    !text.trim()
  ) {
    throw new Error(
      "Cannot embed an empty query."
    );
  }

  const embedModel =
    genAI.getGenerativeModel({
      model: EMBEDDING_MODEL
    });

  const result =
    await embedModel.embedContent({

      content: {
        parts: [
          {
            text: text.trim()
          }
        ]
      },

      outputDimensionality:
        EMBEDDING_DIMENSIONS,

      taskType:
        "RETRIEVAL_QUERY"
    });

  return normalizeEmbedding(
    result.embedding.values
  );
}


/* =========================================================
   Search similar chunks
   ========================================================= */

export async function searchSimilarChunks(
  queryEmbedding,
  limit = 5,
  threshold = 0.30,
  filterCategory = null
) {

  if (
    !Array.isArray(queryEmbedding)
  ) {
    throw new Error(
      "queryEmbedding must be an array."
    );
  }

  const normalizedQuery =
    normalizeEmbedding(
      queryEmbedding
    );

  const {
    data,
    error
  } = await supabase.rpc(
    "match_chunks",
    {
      query_embedding:
        normalizedQuery,

      match_threshold:
        threshold,

      match_count:
        limit,

      filter_category:
        filterCategory
    }
  );

  if (error) {

    console.error(
      "Vector search error:",
      error
    );

    throw error;
  }

  return data || [];
}