const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount API routes
app.use("/api", routes);

module.exports = app;