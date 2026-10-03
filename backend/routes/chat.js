import express from "express";

import {
  getQueryEmbedding,
  searchSimilarChunks
} from "../services/vectorSearch.js";

import {
  generateChatResponse
} from "../services/llmService.js";

const router = express.Router();

const FALLBACK_REPLY =
  "I don't have enough verified information to answer that confidently. Please contact the Meridian Dynamics team directly for a custom inquiry.";


/* =========================================================
   POST /api/chat
   ========================================================= */

router.post("/", async (req, res) => {

  const startTime = Date.now();

  try {

    /* -------------------------------------------------------
       Validate input
       ------------------------------------------------------- */

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {

      return res.status(400).json({
        error:
          "Valid message string is required."
      });
    }

    if (message.length > 1000) {

      return res.status(400).json({
        error:
          "Message is too long."
      });
    }


    /* -------------------------------------------------------
       STEP 1 — Query embedding
       ------------------------------------------------------- */

    const queryEmbedding =
      await getQueryEmbedding(message);

    console.log(
      `[Atlas] Query embedded in ${
        Date.now() - startTime
      }ms`
    );


    /* -------------------------------------------------------
       STEP 2 — Vector retrieval
       ------------------------------------------------------- */

    const chunks =
      await searchSimilarChunks(
        queryEmbedding,

        /*
         * Retrieve a few extra candidates.
         */
        6,

        /*
         * Start permissive and let the LLM
         * decide using grounded context.
         */
        0.30
      );

    console.log(
      `[Atlas] Retrieved ${chunks.length} chunks`
    );


    /* -------------------------------------------------------
       STEP 3 — No relevant context
       ------------------------------------------------------- */

    if (!chunks.length) {

      return res.json({
        reply: FALLBACK_REPLY,
        meta: {
          retrieved: 0
        }
      });
    }


    /* -------------------------------------------------------
       STEP 4 — Generate grounded response
       ------------------------------------------------------- */

    const reply =
      await generateChatResponse(
        message,
        chunks
      );


    /* -------------------------------------------------------
       STEP 5 — Response
       ------------------------------------------------------- */

    return res.json({
      reply,

      /*
       * Keep this lightweight and useful for
       * debugging during development.
       *
       * You can remove meta before production.
       */
      meta: {
        retrieved: chunks.length,
        sources: chunks.map(
          chunk =>
            chunk.metadata?.source ||
            "unknown"
        ),
        latencyMs:
          Date.now() - startTime
      }
    });

  } catch (error) {

    console.error(
      "[Atlas] Chat endpoint error:",
      error
    );

    return res.status(500).json({
      error:
        "Internal server error while processing message."
    });
  }
});

export default router;