import { Router } from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();
const BORROW_DAYS = 7;
const isValidId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);


router.post("/", verifyToken, async (req, res) => {
  const { bookId } = req.body ?? {};
  if (!isValidId(bookId)) return res.status(400).json({ message: "Invalid book id" });

  const books = req.db.collection("books");
  const borrows = req.db.collection("borrows");

  const book = await books.findOne({ _id: new ObjectId(bookId) });
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (book.availableCopies <= 0) {
    return res.status(400).json({ message: "This book is not available right now" });
  }

  const borrowDate = new Date();
  const returnDate = new Date(borrowDate.getTime() + BORROW_DAYS * 24 * 60 * 60 * 1000);
  const doc = {
    bookId,
    bookTitle: book.title,
    bookImage: book.image,
    userEmail: req.user.email,
    userName: req.user.name,
    borrowDate,
    returnDate,
  };

  try {
    const result = await borrows.insertOne(doc);
    doc._id = result.insertedId;
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already borrowed this book" });
    }
    throw err;
  }

  const updated = await books.findOneAndUpdate(
    { _id: book._id, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } }
  );
  if (!updated) {
    await borrows.deleteOne({ _id: doc._id });
    return res.status(400).json({ message: "This book is not available right now" });
  }

  res.status(201).json(doc);
});

export default router;
