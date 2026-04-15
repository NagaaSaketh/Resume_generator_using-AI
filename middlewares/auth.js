const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Please login to continue!" });
    }
    const decodedObject = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedObject;
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found!");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

module.exports = { userAuth };
