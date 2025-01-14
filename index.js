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


server.listen(8080);
console.log('Server Activated');