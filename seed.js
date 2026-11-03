// Run once:  node seed.js   (adds 8 sample books so the site has data)
import "dotenv/config";
import { MongoClient } from "mongodb";

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
const samples = [
  ["The Great Gatsby", "F. Scott Fitzgerald", "Fiction", "9780743273565", "A story of wealth, longing and the American dream in the Jazz Age."],
  ["Dune", "Frank Herbert", "Fiction", "9780441172719", "A desert planet, a prophecy and the most valuable substance in the universe."],
  ["A Brief History of Time", "Stephen Hawking", "Science", "9780553380163", "From the Big Bang to black holes, explained for curious readers."],
  ["Sapiens", "Yuval Noah Harari", "History", "9780062316097", "A sweeping look at how humans came to rule the planet."],
  ["Guns, Germs, and Steel", "Jared Diamond", "History", "9780393354324", "Why some societies advanced faster than others."],
  ["Matilda", "Roald Dahl", "Kids", "9780140328721", "A gifted girl, a terrible headmistress and a little bit of magic."],
  ["Harry Potter and the Philosopher's Stone", "J. K. Rowling", "Kids", "9780747532743", "A boy discovers he is a wizard and starts a new life at Hogwarts."],
  ["The Da Vinci Code", "Dan Brown", "Others", "9780307474278", "A murder in the Louvre and a trail of symbols across Europe."],
];

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const books = client.db("booknook").collection("books");
await books.deleteMany({ userEmail: "team@booknook.dev" });
const now = Date.now();
await books.insertMany(
  samples.map(([title, author, category, isbn, description], i) => ({
    title,
    author,
    category,
    image: cover(isbn),
    description,
    totalCopies: 3,
    availableCopies: 3,
    userName: "BookNook Team",
    userEmail: "team@booknook.dev",
    createdAt: new Date(now - i * 60 * 60 * 1000),
  }))
);
console.log("Seeded", samples.length, "books");
await client.close();
