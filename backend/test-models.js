import dotenv from 'dotenv';
dotenv.config();

async function list() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  const generateModels = data.models
    ?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name);
  console.log('Available models for text generation:');
  console.log(generateModels);
}
list();