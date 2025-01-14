import express from 'express';
const server = express();
import cors from 'cors'
import bodyParser from 'body-parser';
import multer from 'multer';
import csv from 'csv-parser';
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path';
//env configaration
dotenv.config();
const upload = multer({ dest: 'uploads/' });
server.use(bodyParser.json())
server.use(cors({ origin: 'https://smpafrontend.vercel.app/' }));
//DB_Connection
import { fileURLToPath } from 'url';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
server.use(express.static(path.join(__dirname, 'public')));

// Example route
server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
server.post('/AIDATA', async (req, res) => {
    try {
        // Validate the incoming data
        const inputData = req.body.data;
        if (!inputData) {
            return res.status(400).json({ error: "Missing 'data' in request body" });
        }

        // Make the API request
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

        // Parse the API response
        const responseData = await response.json();
        const textData = responseData.outputs[0]?.outputs[0]?.results?.text?.data?.text;
 
        if (!textData) {
            return res.status(500).json({ error: "Unexpected API response format" });
        }

        // Return the parsed data
        console.log(textData)
        res.json(textData);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


server.listen(8080);
console.log('Server Activated');