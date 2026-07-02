import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import connectToSocket from "./src/controllers/socketManager.js";
import cors from "cors";

import userroutes from "./src/routes/user.routes.js";

const app = express();
const server = createServer(app);
connectToSocket(server);
app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userroutes);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Convo Backend API is running 🚀",
  });
});

const start = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
  const port = app.get("port");  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

start();
