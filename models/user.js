const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 20 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  balance: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isPremium: { 
    type: Boolean, 
    default: false 
  },
  role: { 
    type: String, 
    default: "user" 
  },
  signupIP: { 
    type: String, 
    default: "unknown" 
  },
  profilePicture: { 
    type: String, 
    default: "/images/profile-picture.png" 
  },

  // ✅ Email verification fields
  verified: { 
    type: Boolean, 
    default: false 
  },
  verificationCode: { 
    type: String, 
    default: null 
  },
  verificationExpires: { 
    type: Date, 
    default: null 
  }
});

module.exports = mongoose.model("User", userSchema);
