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
const upload = multer({ dest: 'uploads/' });

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS Setup
server.use(cors());

// Middleware
server.use(bodyParser.json());
server.use(express.static(path.join(__dirname, 'public')));

// Root route
server.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
        res.setHeader('Access-Control-Allow-Origin', 'https://smpafrontend.vercel.app');
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
