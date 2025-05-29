const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    minlength: 6,
    required: function () {
      return !this.googleId;
    }
  },
  googleId: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;