const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:9000", "http://backend:9000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve static files
app.use(express.static(__dirname));

// Handle all routes - for SPA navigation
app.get("/callback", (req, res) => {
  console.log("Callback route accessed");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*", (req, res) => {
  console.log("Route accessed:", req.path);
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
