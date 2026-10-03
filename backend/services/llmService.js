import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildPrompt } from "../rag/prompts.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


/* =========================================================
   MODEL CONFIGURATION
   ========================================================= */

const PRIMARY_MODEL =
  "models/gemini-3.1-flash-lite";

const FALLBACK_MODEL =
  "models/gemini-2.5-flash";


/* =========================================================
   RETRY CONFIGURATION
   ========================================================= */

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 700;


/* =========================================================
   Utility — delay
   ========================================================= */

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}


/* =========================================================
   Determine whether an error is retryable
   ========================================================= */

function isRetryableError(error) {

  const status =
    error?.status ||
    error?.statusCode;

  /*
   * 429 = rate limit
   * 500 = internal server error
   * 502 = bad gateway
   * 503 = service unavailable
   * 504 = gateway timeout
   */

  return [
    429,
    500,
    502,
    503,
    504
  ].includes(status);
}


/* =========================================================
   Generate response using a specific model
   ========================================================= */

async function generateWithModel(
  modelName,
  prompt
) {

  const model =
    genAI.getGenerativeModel({

      model: modelName,

      systemInstruction:
        SYSTEM_PROMPT,

      generationConfig: {

        /*
         * Keep Atlas concise and factual.
         */
        temperature: 0.2,

        /*
         * Prevent unnecessarily long
         * website-chatbot responses.
         */
        maxOutputTokens: 500
      }
    });

  const result =
    await model.generateContent(
      prompt
    );

  return result.response.text();
}


/* =========================================================
   Main Atlas response generator
   ========================================================= */

export async function generateChatResponse(
  userQuery,
  contextChunks
) {

  const prompt =
    buildPrompt(
      userQuery,
      contextChunks
    );


  /* -------------------------------------------------------
     1. Primary model
     ------------------------------------------------------- */

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {

    try {

      const response =
        await generateWithModel(
          PRIMARY_MODEL,
          prompt
        );

      console.log(
        `[Atlas] Response generated using ${PRIMARY_MODEL}`
      );

      return response;

    } catch (error) {

      console.error(
        `[Atlas] Primary model attempt ${
          attempt + 1
        } failed:`,
        error?.message || error
      );


      /*
       * If this isn't a temporary/transient
       * error, don't waste time retrying.
       */
      if (!isRetryableError(error)) {
        throw error;
      }


      /*
       * Retry once after a short delay.
       */
      if (attempt < MAX_RETRIES) {

        console.log(
          `[Atlas] Retrying primary model in ${RETRY_DELAY_MS}ms...`
        );

        await sleep(
          RETRY_DELAY_MS
        );
      }
    }
  }


  /* -------------------------------------------------------
     2. Fallback model
     * ------------------------------------------------------- */

  console.log(
    `[Atlas] Falling back to ${FALLBACK_MODEL}`
  );

  try {

    const response =
      await generateWithModel(
        FALLBACK_MODEL,
        prompt
      );

    console.log(
      `[Atlas] Response generated using fallback model`
    );

    return response;

  } catch (error) {

    console.error(
      `[Atlas] Fallback model failed:`,
      error?.message || error
    );

    /*
     * Let chat.js handle the final 500.
     * We don't silently fabricate a response.
     */
    throw error;
  }
}