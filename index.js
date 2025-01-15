import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const server = express();
const corsOptions = {
    origin: 'https://smpafrontend.vercel.app', // Your React app's origin
    credentials: true,              // This sets `Access-Control-Allow-Credentials: true`
  };
server.use(cors(corsOptions));

// CORS Setup

// Middleware

// Root route
server.get('/', (req, res) => {
    res.json("Hello");
});

// AIDATA route
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
        res.json(textData);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
