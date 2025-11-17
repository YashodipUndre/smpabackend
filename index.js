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
  model: "models/text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ------------------------------------------------------
// 2. LOAD FILE
// ------------------------------------------------------
// const rawText = fs.readFileSync("extended_social_media_dataset.csv", "utf8");

// // ------------------------------------------------------
// // 3. SPLIT TEXT INTO CHUNKS
// // ------------------------------------------------------
// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   chunkOverlap: 200,
// });

// const chunks = await splitter.splitText(rawText);
// // ------------------------------------------------------
// // 4. ASTRA DB VECTORSTORE (correct package!)
// // ------------------------------------------------------
// // ------------------------------------------------------
// // 4. ASTRA DB VECTORSTORE (CORRECT VERSION)
// // ------------------------------------------------------

// // 1️⃣ Create vector store WITHOUT creating collection
// // 4. ASTRA DB VECTORSTORE (CORRECT)
// const vectorStore = await AstraDBVectorStore.fromTexts(
//   chunks,                            // array of text chunks
//   chunks.map(() => ({ source: "csv" })), // metadata array
//   embeddings,
//   {
//     token: process.env.ASTRA_DB_APPLICATION_TOKEN,
//     endpoint: process.env.ASTRA_DB_ENDPOINT,
//     collection: process.env.ASTRA_DB_COLLECTION,
//     keyspace: process.env.ASTRA_DB_KEYSPACE,
//     collectionOptions: {
//       vector: {
//         dimension: 768,
//         metric: "cosine"
//       }
//     }
//   }
// );



// Root route
// // AIDATA route for processing POST requests
server.post('/AIDATA', async (req, res) => {
  try {
    const inputData = req.body.data;
    if (!inputData) {
      return res.status(400).json({ error: "Missing 'data' in request body" });
    }
      const results = await vectorStore.similaritySearch(inputData, 5);

      const context = results.map(r => r.pageContent).join("\n\n");

      const prompt = `
Context:
${context}

User question: ${inputData}

Based on the context, answer accurately. and also add that should people use this content type for there bussiness growth and why
`;

      const response = await model.generateContent(prompt);
    // ------------------------------------------------------
      const text = response.response.text();
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
  collection: "posts_info",   // existing collection name
  skipCollectionProvisioning: true,
});
await vectorStore.initialize();




// Export the server as a handler for Vercel
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});