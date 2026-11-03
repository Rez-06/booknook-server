import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

const isValidId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// GET /books?limit=6  -> newest first (public)
router.get("/", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 0, 100);
  const cursor = req.db.collection("books").find().sort({ createdAt: -1 });
  if (limit) cursor.limit(limit);
  res.json(await cursor.toArray());
});

// GET /books/:id
router.get("/:id", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid book id" });
  const book = await req.db.collection("books").findOne({ _id: new ObjectId(req.params.id) });
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

export default router;
