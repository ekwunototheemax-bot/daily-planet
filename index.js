const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "posts.json");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Data helpers (posts are persisted to a JSON file) ----------

function readPosts() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Routes ----------

// READ: home page lists all posts
app.get("/", (req, res) => {
  const posts = readPosts().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.render("index", { posts, formatDate });
});

// CREATE: form to write a new post
app.get("/posts/new", (req, res) => {
  res.render("new");
});

// CREATE: save the new post
app.post("/posts", (req, res) => {
  const { title, author, imageUrl, content } = req.body;

  if (!title || !content) {
    return res.status(400).send("Title and content are required.");
  }

  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    title: title.trim(),
    author: author && author.trim() ? author.trim() : "Anonymous",
    imageUrl: imageUrl ? imageUrl.trim() : "",
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);
  writePosts(posts);
  res.redirect("/");
});

// READ: view a single post
app.get("/posts/:id", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) {
    return res.status(404).render("404");
  }

  res.render("show", { post, formatDate });
});

// UPDATE: form to edit an existing post
app.get("/posts/:id/edit", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) {
    return res.status(404).render("404");
  }

  res.render("edit", { post });
});

// UPDATE: save the edited post
app.put("/posts/:id", (req, res) => {
  const { title, author, imageUrl, content } = req.body;
  const posts = readPosts();
  const index = posts.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).render("404");
  }

  if (!title || !content) {
    return res.status(400).send("Title and content are required.");
  }

  posts[index] = {
    ...posts[index],
    title: title.trim(),
    author: author && author.trim() ? author.trim() : "Anonymous",
    imageUrl: imageUrl ? imageUrl.trim() : "",
    content: content.trim(),
  };

  writePosts(posts);
  res.redirect(`/posts/${req.params.id}`);
});

// DELETE: remove a post
app.delete("/posts/:id", (req, res) => {
  const posts = readPosts();
  const filtered = posts.filter((p) => p.id !== req.params.id);
  writePosts(filtered);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Daily Planet is running on http://localhost:${PORT}`);
});
