require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lb3rxqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("frauddb"); // Use your DB name
    const reportCollection = db.collection("reports"); // Collection name

    // GET route to fetch all reports
    app.get("/reports", async (req, res) => {
      try {
        const allReports = await reportCollection.find().toArray();
        res.send(allReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).send({ error: "Failed to fetch reports" });
      }
    });

    // Search by phone number
    app.get("/reports/:phone", async (req, res) => {
      const phone = req.params.phone;
      const report = await reportCollection.findOne({ phoneNumber: phone });
      if (report) {
        res.send(report);
      } else {
        res.status(404).send({ error: "No report found for this number" });
      }
    });

    // // POST route to receive and insert data
    // app.post("/add-report", async (req, res) => {
    //   const reportData = req.body;
    //   console.log("Received Report:", reportData);

    //   const result = await reportCollection.insertOne(reportData);
    //   res.send(result);
    // });

    app.post("/add-report", async (req, res) => {
      const newReport = req.body;
      const {
        phoneNumber,
        giveTuition,
        confirmTuition,
        cancelTuition,
        summaryOfExperience,
      } = newReport;

      try {
        // Check if report already exists for the phone number
        const existing = await reportCollection.findOne({ phoneNumber });

        if (existing) {
          // Update the existing record
          const updatedReport = {
            $set: { summaryOfExperience }, // replace summary
            $inc: {
              giveTuition: parseInt(giveTuition),
              confirmTuition: parseInt(confirmTuition),
              cancelTuition: parseInt(cancelTuition),
            },
          };

          const result = await reportCollection.updateOne(
            { phoneNumber },
            updatedReport
          );

          res.send(result);
        } else {
          // Insert new report
          const result = await reportCollection.insertOne({
            phoneNumber,
            giveTuition: parseInt(giveTuition),
            confirmTuition: parseInt(confirmTuition),
            cancelTuition: parseInt(cancelTuition),
            summaryOfExperience,
          });
          res.send(result);
        }
      } catch (error) {
        console.error("Error in add-report:", error);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fraud Teacher is live");
});

app.listen(port, () => {
  console.log(`Fraud Teacher is sitting on port ${port}`);
});
