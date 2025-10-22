const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKS_FILE = path.join(__dirname, 'books.json');

app.use(express.json());

// Helper function to read books from file
function readBooks() {
  try {
    const data = fs.readFileSync(BOOKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading books.json:', err);
    return [];
  }
}

// Helper function to write books to file
function writeBooks(books) {
  try {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
  } catch (err) {
    console.error('Error writing to books.json:', err);
    throw new Error('Failed to save books');
  }
}

// GET /books - return all books
app.get('/books', (req, res) => {
  const books = readBooks();
  res.json(books);
});

// GET /books/available - return only available books
app.get('/books/available', (req, res) => {
  const books = readBooks();
  const availableBooks = books.filter(book => book.available);
  res.json(availableBooks);
});

// POST /books - add a new book
app.post('/books', (req, res) => {
  const { title, author, available } = req.body;
  if (!title || !author || available === undefined) {
    return res.status(400).json({ error: 'Title, author, and available are required' });
  }

  const books = readBooks();
  const newId = books.length > 0 ? Math.max(...books.map(book => book.id)) + 1 : 1;
  const newBook = { id: newId, title, author, available };
  books.push(newBook);

  try {
    writeBooks(books);
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save book' });
  }
});

// PUT /books/:id - update a book
app.put('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const { title, author, available } = req.body;
  const books = readBooks();
  const bookIndex = books.findIndex(book => book.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  if (title !== undefined) books[bookIndex].title = title;
  if (author !== undefined) books[bookIndex].author = author;
  if (available !== undefined) books[bookIndex].available = available;

  try {
    writeBooks(books);
    res.json(books[bookIndex]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /books/:id - delete a book
app.delete('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const books = readBooks();
  const bookIndex = books.findIndex(book => book.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const deletedBook = books.splice(bookIndex, 1)[0];

  try {
    writeBooks(books);
    res.json(deletedBook);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
