const express = require("express");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validator");
const bcrypt = require("bcrypt");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const { userAuth } = require("../middlewares/auth");

// API route to create a new user

authRouter.post("/signup", async (req, res) => {
  try {
    // Validate user data
    validateSignUpData(req);
    const { firstName, lastName, emailId, password } = req.body;

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res
      .status(201)
      .json({ message: "User added successfully", data: savedUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create new user", error: err.message });
  }
});

// API route to user login

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Create a JWT token
      const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

      // Add token to cookie & send the response back to the user.
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 8 * 60 * 60 * 1000,
      });
      res.status(200).json({ message: "Login successful!", user });
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to login", error: err.message });
  }
});

// API route to logout

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.status(200).send("Logout successful!");
});

// API route to get loggedin user details

authRouter.get("/profile", userAuth, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user details",
      error: err.message,
    });
  }
});

module.exports = authRouter;
