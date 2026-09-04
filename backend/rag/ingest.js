import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the active model returned by your account
const embedModel = genAI.getGenerativeModel({ 
  model: 'models/gemini-embedding-001' 
});

const KNOWLEDGE_DIR = path.resolve(process.cwd(), '../knowledge');

async function getEmbedding(text) {
  // Enforce 768 dimensions to match our Supabase schema
  const result = await embedModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });
  return result.embedding.values;
}

function chunkDocument(content, chunkSize = 450) {
  const paragraphs = content.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? '\n\n' : '') + para;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function ingestFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const relativePath = path.relative(KNOWLEDGE_DIR, filePath);

  console.log(`Ingesting: ${relativePath}`);

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .upsert(
      {
        source: relativePath,
        category: frontmatter.category || 'general',
        metadata: frontmatter,
      },
      { onConflict: 'source' }
    )
    .select('id')
    .single();

  if (docErr) {
    console.error(`Document error on ${relativePath}:`, docErr);
    return;
  }

  // Clear previous chunks for clean re-indexing
  await supabase.from('document_chunks').delete().eq('document_id', doc.id);

  const chunks = chunkDocument(content);
  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);
    const { error: chunkErr } = await supabase.from('document_chunks').insert({
      document_id: doc.id,
      content: chunk,
      metadata: frontmatter,
      embedding: embedding,
    });

    if (chunkErr) console.error(`Error saving chunk:`, chunkErr);
  }
}

async function walkDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      await walkDirectory(fullPath);
    } else if (file.isFile() && file.name.endsWith('.md')) {
      await ingestFile(fullPath);
    }
  }
}

async function run() {
  try {
    console.log(`Starting ingestion from: ${KNOWLEDGE_DIR}`);
    await walkDirectory(KNOWLEDGE_DIR);
    console.log('✓ All knowledge files chunked, embedded, and saved to Supabase.');
  } catch (err) {
    console.error('Ingestion failed:', err);
  }
}

run();