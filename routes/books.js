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

// POST /books  (protected) - owner info comes from the verified token, not the body
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

// PATCH /books/:id  (protected, owner only)
router.patch("/:id", verifyToken, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid book id" });

  const books = req.db.collection("books");
  const book = await books.findOne({ _id: new ObjectId(req.params.id) });
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.userEmail !== req.user.email) {
    return res.status(403).json({ message: "You can only edit your own books" });
  }

  const { data, error } = cleanBook({ ...book, ...req.body });
  if (error) return res.status(400).json({ message: error });

  // Keep "available" in step with the change in total copies
  const diff = data.totalCopies - book.totalCopies;
  const availableCopies = Math.max(book.availableCopies + diff, 0);

  const updated = await books.findOneAndUpdate(
    { _id: book._id },
    { $set: { ...data, availableCopies } },
    { returnDocument: "after" }
  );
  res.json(updated);
});

// DELETE /books/:id  (protected, owner only)
router.delete("/:id", verifyToken, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid book id" });

  const books = req.db.collection("books");
  const book = await books.findOne({ _id: new ObjectId(req.params.id) });
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.userEmail !== req.user.email) {
    return res.status(403).json({ message: "You can only delete your own books" });
  }

  await books.deleteOne({ _id: book._id });
  await req.db.collection("borrows").deleteMany({ bookId: req.params.id });
  res.json({ deleted: true });
});

export default router;
