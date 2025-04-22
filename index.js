const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lb3rxqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let cachedClient = null;
let reportCollection;

async function connectToMongo() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  cachedClient = client;
  reportCollection = client.db("frauddb").collection("reports");

  console.log("Connected to MongoDB (cached)");
  return cachedClient;
}

// GET all reports
app.get("/reports", async (req, res) => {
  try {
    await connectToMongo();
    const reports = await reportCollection.find().toArray();
    res.send(reports);
  } catch (err) {
    console.error("GET /reports error:", err);
    res.status(500).send({ error: "Failed to fetch reports" });
  }
});

// GET report by phone
app.get("/reports/:phone", async (req, res) => {
  try {
    await connectToMongo();
    const report = await reportCollection.findOne({
      phoneNumber: req.params.phone,
    });
    report ? res.send(report) : res.status(404).send({ error: "Not found" });
  } catch (err) {
    console.error("GET /reports/:phone error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// POST add report
app.post("/add-report", async (req, res) => {
  try {
    await connectToMongo();

    const {
      phoneNumber,
      giveTuition,
      confirmTuition,
      cancelTuition,
      summaryOfExperience,
    } = req.body;

    const existing = await reportCollection.findOne({ phoneNumber });

    if (existing) {
      const result = await reportCollection.updateOne(
        { phoneNumber },
        {
          $set: { summaryOfExperience },
          $inc: {
            giveTuition: parseInt(giveTuition),
            confirmTuition: parseInt(confirmTuition),
            cancelTuition: parseInt(cancelTuition),
          },
        }
      );
      res.send(result);
    } else {
      const result = await reportCollection.insertOne({
        phoneNumber,
        giveTuition: parseInt(giveTuition),
        confirmTuition: parseInt(confirmTuition),
        cancelTuition: parseInt(cancelTuition),
        summaryOfExperience,
      });
      res.send(result);
    }
  } catch (err) {
    console.error("POST /add-report error:", err);
    res.status(500).send({ error: "Failed to add report" });
  }
});

app.get("/", (req, res) => {
  res.send("Fraud Teacher is live");
});

module.exports = app;
