import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import booksRouter from "./routes/books.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ app: "BookNook API", status: "running" });
});

// Attach the database to every request
app.use(async (req, res, next) => {
  try {
    req.db = await getDb();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/books", booksRouter);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`BookNook server running on http://localhost:${port}`));
