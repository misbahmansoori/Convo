import httpStatus from "http-status";
import { User } from "../models/userModel.js";
import bcrypt, { hash } from "bcrypt";
import crypto from "node:crypto";

// Login existing user.
const login = async (req, res) => {
  // Extract username and password from request body.
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Please provide" });
  }
  try {
    // Find user by username.
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    // Compare entered password with hashed password stored in DB.
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Generate authentication token.
      let token = crypto.randomBytes(20).toString("hex");
      // Save generated token in database.
      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({
        token: token,
        user: { name: user.name, username: user.username },
      });
    }

    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Invalid credentials" });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

// Register new user.
const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    // Check if username already exists.
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exist" });
    }

    // Hash password before storing in database.
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    // Create and save new user document.
    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (e) {
    res.json({ message: `somethin went wrong ${e}` });
  }
};

export { login, register };
