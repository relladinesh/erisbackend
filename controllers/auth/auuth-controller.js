const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Adjust the path as needed
const passport = require('passport');
require('dotenv').config();

// Middleware for validating request body
const validateRequestBody = (req, res, next) => {
  const { userName, email, password } = req.body;
  if (!userName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "UserName, Email and Password are required fields",
    });
  }
  next();
};

// Register User
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with the same email! Please try again",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist! Please register first",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
    if (!checkPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password! Please try again",
      });
    }

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "60m" }
    );

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

// Logout User
const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }
};

// Google OAuth login success handler
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8); // Generates a random 8-character password
};

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Google auth callback route
const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/login?googlelogin=failure",
});

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      userName: user.userName,
    },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      userName: user.userName,
    },
    process.env.JWT_SECRET,  // Use the same secret as access tokens
    { expiresIn: "7d" }
  );
};

// Google OAuth login failure handler
const googleAuthRedirect = (req, res) => {
  try {
    // Generate tokens for the authenticated user
    if (!req.user) {
      console.error("No user found in request after Google authentication");
      return res.redirect(
        "http://localhost:5173/auth/login?googleLogin=failure"
      );
    }

    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    // Set refresh token as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Changed to Lax for cross-site redirect
      path: "/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set regular token as cookie too for consistent auth mechanism
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000, // 60 minutes to match the token expiration
    });

    // Redirect to shop/home instead of auth/login
    res.redirect("http://localhost:5173/shop/home");
  } catch (error) {
    console.error("Error in googleAuthRedirect:", error);
    res.redirect("http://localhost:5173/auth/login?googleLogin=failure");
  }
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware, googleAuth, googleAuthCallback, googleAuthRedirect, validateRequestBody };