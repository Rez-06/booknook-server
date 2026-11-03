import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ app: "BookNook API", status: "running" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`BookNook server running on http://localhost:${port}`));
