const express = require('express');
const passport = require('passport');
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  googleAuthRedirect,
  googleAuth,
  googleAuthCallback
} = require('../../controllers/auth/auuth-controller'); // Corrected the file name

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/check-auth', authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user,
  });
});

// Google OAuth routes
router.get('/google', googleAuth);

router.get('/google/callback', googleAuthCallback, googleAuthRedirect);

module.exports = router;