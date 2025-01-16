import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

dotenv.config();

const server = express();

// CORS options

// Enable CORS with the options
server.use(cors());

// Middleware for parsing JSON body
server.use(bodyParser.json());

// CORS Preflight Request Handlin

// Root route
server.get('/', (req, res) => {
  res.json("Hello");
});

// AIDATA route for processing POST requests
server.post('/AIDATA', async (req, res) => {
  try {
    const inputData = req.body.data;
    if (!inputData) {
      return res.status(400).json({ error: "Missing 'data' in request body" });
    }

    const response = await fetch(`${process.env.URLL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AIAPI}`,
      },
      body: JSON.stringify({
        input_value: inputData,
        output_type: "chat",
        input_type: "chat",
      }),
    });

    if (!response.ok) {
      console.error('API Error:', response.status);
      return res.status(response.status).json({ error: 'API request failed' });
    }

    const responseData = await response.json();
    const textData = responseData.outputs[0]?.outputs[0]?.results?.text?.data?.text;

    if (!textData) {
      return res.status(500).json({ error: "Unexpected API response format" });
    }

    // Send the result back to the client
    res.json(textData);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the server as a handler for Vercel
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 10000;
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});