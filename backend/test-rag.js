import { getQueryEmbedding, searchSimilarChunks } from "./services/vectorSearch.js";
import dotenv from "dotenv";

dotenv.config();

const questions = [
  "What services does Meridian Dynamics offer?",
  "How much does a website cost?",
  "How does Meridian Dynamics work?",
  "What makes Meridian Dynamics different from other agencies?"
];

async function testQuery(question) {
  console.log("\n========================================");
  console.log(`QUESTION: ${question}`);
  console.log("========================================");

  try {
    /* -----------------------------------------
       1. Generate query embedding
       ----------------------------------------- */

    console.log("\n1. Generating embedding...");

    const embedding =
      await getQueryEmbedding(question);

    console.log(
      `✓ Embedding generated: ${embedding.length} dimensions`
    );


    /* -----------------------------------------
       2. Search Supabase
       ----------------------------------------- */

    console.log("\n2. Searching knowledge base...");

    const results =
      await searchSimilarChunks(
        embedding,
        5,
        0.30
      );


    /* -----------------------------------------
       3. Display results
       ----------------------------------------- */

    if (!results.length) {

      console.log(
        "\n❌ No relevant chunks found."
      );

      return;
    }

    console.log(
      `\n✓ Found ${results.length} relevant chunks\n`
    );

    results.forEach(
      (result, index) => {

        console.log(
          `----- RESULT ${index + 1} -----`
        );

        console.log(
          `Similarity: ${result.similarity}`
        );

        console.log(
          `Source: ${
            result.metadata?.source ||
            "unknown"
          }`
        );

        console.log(
          "\nContent:"
        );

        console.log(
          result.content
        );

        console.log("");
      }
    );

  } catch (error) {

    console.error(
      "\n❌ RAG test failed:"
    );

    console.error(error);
  }
}


async function run() {

  console.log(
    "========================================"
  );

  console.log(
    " MERIDIAN ATLAS — RAG RETRIEVAL TEST"
  );

  console.log(
    "========================================"
  );

  for (
    const question of questions
  ) {

    await testQuery(
      question
    );
  }

  console.log(
    "\n========================================"
  );

  console.log(
    " RAG RETRIEVAL TEST COMPLETE"
  );

  console.log(
    "========================================"
  );
}


run();