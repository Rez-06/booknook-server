import { Router } from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];
const isValidId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

function cleanBook(body = {}) {
  const title = String(body.title ?? "").trim();
  const author = String(body.author ?? "").trim();
  const category = String(body.category ?? "").trim();
  const image = String(body.image ?? "").trim();
  const description = String(body.description ?? "").trim();
  const totalCopies = Number(body.totalCopies);

  if (!title || !author || !image || !description) return { error: "All fields are required" };
  if (!CATEGORIES.includes(category)) return { error: "Invalid category" };
  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return { error: "Total copies must be at least 1" };
  }
  return { data: { title, author, category, image, description, totalCopies } };
}


router.get("/", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 0, 100);
  const cursor = req.db.collection("books").find().sort({ createdAt: -1 });
  if (limit) cursor.limit(limit);
  res.json(await cursor.toArray());
});


router.get("/:id", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid book id" });
  const book = await req.db.collection("books").findOne({ _id: new ObjectId(req.params.id) });
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});


router.post("/", verifyToken, async (req, res) => {
  const { data, error } = cleanBook(req.body);
  if (error) return res.status(400).json({ message: error });

  const doc = {
    ...data,
    availableCopies: data.totalCopies,
    userName: req.user.name,
    userEmail: req.user.email,
    createdAt: new Date(),
  };
  const result = await req.db.collection("books").insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
});

export default router;
