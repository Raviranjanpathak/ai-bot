require("dotenv").config();

const express = require("express");          
const cors = require("cors");
const session = require("express-session");  
const path = require("path");

const connectDB = require("./config/db");   

// ROUTES
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const imageRoutes = require("./routes/imageRoutes");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

// ================= DB =================
connectDB();

// ================= CACHE FIX =================
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// ================= SESSION =================
app.use(session({
  secret: "secretkey", 
  resave: false,
  saveUninitialized: true
}));

// ================= ROUTES =================
app.use("/", authRoutes);
app.use("/", chatRoutes);
app.use("/", imageRoutes);

// ================= BASIC ROUTES =================
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

app.get("/chat", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

// ================= SERVER =================
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 RaviBot running on http://localhost:${port}`);
});