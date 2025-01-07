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
import { DataAPIClient } from "@datastax/astra-db-ts";

const DBTOKEN = process.env.DBTOKEN;
const DBURL = process.env.DBURL;
const client = new DataAPIClient(DBTOKEN); // Ensure `DBTOKEN` is the correct Astra DB token
const db = client.db(
    'https://5ff2d881-0105-4ab1-8a52-ed42ee395a4b-us-east-2.apps.astra.datastax.com', // Ensure this is the correct REST API endpoint
    { keyspace: "default_keyspace" } // Replace "default_keyspace" with your actual keyspace
);

// Function to test connection
(async () => {
    try {
        const colls = await db.listCollections(); // List collections (tables)

        console.log('Connected to AstraDB:', colls);
    } catch (err) {
        console.error('Error connecting to AstraDB:', err);
    }
})();
const con = db.collection('posts_info');
server.post('/upload', upload.single('csvfile'), (req, res) => {
    const data = req.body.text;
    if (!req.file) {
        throw new Error('No file uploaded');
    }
    else {
        const filePath = req.file.path;
        const results = [];
        const jsonresults = [];
        fs.createReadStream(filePath)
            .pipe(csv())  // Parses the CSV file
            .on('data', (row) => {
                // Assuming the CSV has columns: column1, column2, column3
                results.push(row);

            })
            .on('end', async () => {
                // Insert each row into Astra DB
                const insertPromises = results.map(async (row) => {
                    const document = {
                        Platform: row.Platform,
                        Post_ID: row['Post ID'],
                        Post_Type: row['Post Type'],
                        Post_Content: row['Post Content'],
                        Post_Timestamp: row['Post Timestamp'],
                        Date: row.Date,
                        Weekday_Type: row['Weekday Type'],
                        Time: row.Time,
                        Time_Periods: row['Time Periods'],
                        Likes: row.Likes,
                        Comments: row.Comments,
                        Shares: row.Shares,
                        Impressions: row.Impressions,
                        Reach: row.Reach,
                        Engagement_Rate: row['Engagement Rate'],
                        Audience_Age: row['Audience Age'],
                        Age_Group: row['Age Group'],
                        Audience_Gender: row['Audience Gender'],
                        Audience_Location: row['Audience Location'],
                        Audience_Continent: row['Audience Continent'],
                        Audience_Interests: row['Audience Interests'],
                        Campaign_ID: row['Campaign ID'],
                        Sentiment: row.Sentiment,
                        Influencer_ID: row['Influencer ID'],
                    };
                    jsonresults.push(document)
                    await con.insertOne(document);

                });

                await Promise.all(insertPromises);
                // queries for average engagment matrix
                const postRowArray = await con.find({ Post_Type: { $eq: data } });
                const postRows = await postRowArray.toArray();
                let totalLikes = 0;
                let totalComments = 0;
                let totalShares = 0;
                let totalImpressions = 0;
                let totalReach = 0;
              let postCount = 0;

                // Iterate through the rows and accumulate the values
                postRows.forEach((row) => {
                    // Add the values to the totals
                    totalLikes += parseInt(row.Likes) || 0;
                    totalComments += parseInt(row.Comments) || 0;
                    totalShares += parseInt(row.Shares) || 0;
                    totalImpressions += parseInt(row.Impressions) || 0;
                    totalReach += parseInt(row.Reach) || 0;
                    postCount++;
                });

                // Calculate the averages
                const averageLikes = totalLikes / postCount;
                const averageComments = totalComments / postCount;
                const averageShares = totalShares / postCount;
                const averageImpressions = totalImpressions / postCount;
                const averageReach = totalReach / postCount;
                res.json({jsonresults,averageLikes,averageComments,averageImpressions,averageReach,averageShares});
            })
            .on('error', (err) => {
                console.error('Error reading the CSV file:', err);
                res.status(500).json({ error: 'Error reading the CSV file', message: err.message });
            });
    }

});


server.listen(8080);
console.log('Server Activated');