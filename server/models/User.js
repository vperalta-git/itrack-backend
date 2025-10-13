const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  phoneno: String,
  email: String,
  password: String,
  role: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profilePicture: String, // URL or base64 string for profile picture
  profilePictureUrl: String, // Alternative URL field
  lastActive: Date
});

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;

