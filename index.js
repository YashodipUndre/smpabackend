import express from 'express';
const server = express();
import cors from 'cors'
import bodyParser from 'body-parser';
import multer from 'multer';
import csv from 'csv-parser';
import dotenv from 'dotenv'
import fs from 'fs'
//env configaration
dotenv.config();
const upload = multer({ dest: 'uploads/' });
server.use(bodyParser.json())
server.use(cors());
//DB_Connection
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