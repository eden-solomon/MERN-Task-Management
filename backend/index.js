require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db")
const app = express();
const authRoutes=require('./routes/authRoutes')
const userRoutes=require('./routes/userRoutes')
const taskRoutes=require('./routes/taskRoutes')
const reportRoutes=require('./routes/reportRoutes')
connectDB()
// Middleware to handle CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON requests
app.use(express.json());

//routes

app.use("/api/auth",authRoutes)
app.use("/api/users",userRoutes)
app.use("/api/tasks",taskRoutes)
app.use("/api/reports",reportRoutes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
