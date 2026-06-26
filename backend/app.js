import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import connectToSocket from "./src/controllers/socketManager.js";
import cors from "cors";

import userroutes from "./src/routes/user.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userroutes);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const start = async () => {
  app.set("mongo_user");
  const connectionDb = await mongoose.connect(process.env.MONGO_URI);
  console.log("Mongo db connected ");
  server.listen(app.get("port"), () => {
    console.log("Listening on port 8000");
  });
};

start();
