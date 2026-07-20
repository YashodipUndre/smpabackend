import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Ensure node-fetch is installed
import multer from 'multer';
import fs from "fs";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
dotenv.config();
const server = express();
server.use(cors());
server.use(bodyParser.json());

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Fallback model list — each model gets ~20 free requests/day
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

async function generateWithFallback(prompt) {
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(prompt);
      console.log(`✅ Used model: ${modelName}`);
      return response.response.text();
    } catch (err) {
      console.warn(`⚠️ Model ${modelName} failed: ${err.message}`);
      continue;
    }
  }
  return "All AI models are currently at their daily limit. Please try again tomorrow.";
}

let isVectorStoreInitialized = false;

server.get('/', (req, res) => {
  res.send('Node backend is running!');
});

// Root route
// // AIDATA route for processing POST requests
server.post('/AIDATA', async (req, res) => {
  try {
    const inputData = req.body.data;
    if (!inputData) {
      return res.status(400).json({ error: "Missing 'data' in request body" });
    }

    if (!isVectorStoreInitialized) {
      await vectorStore.initialize();
      isVectorStoreInitialized = true;
    }

      const results = await vectorStore.similaritySearch(inputData, 5);

      const context = results.map(r => r.pageContent).join("\n\n");

      const prompt = `
Context:
${context}

User question: ${inputData}

Based on the context, answer accurately. and also add that should people use this content type for there bussiness growth and why
`;

      const text = await generateWithFallback(prompt);
      console.log(text);

    // Send the result back to the client
    res.json(text);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const vectorStore = new AstraDBVectorStore(embeddings, {
  token: process.env.ASTRA_DB_APPLICATION_TOKEN,
  endpoint: process.env.ASTRA_DB_ENDPOINT,
  collection: "posts_info_v2",   // existing collection name
  skipCollectionProvisioning: true,
});





// Export the server as a handler for Vercel
export default server;

// Only start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const HOST = process.env.HOST || '0.0.0.0';
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
  });
}