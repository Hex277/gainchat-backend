// ======================
// 🟢 GainChat - server.js
// ======================

require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

// ✅ Import User model
const User = require("./models/user");

const app = express();

// ======================
// 🔗 MongoDB Connection
// ======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ======================
// ⚙️ Middleware
// ======================

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(bodyParser.json());
app.use("/Workspace", express.static(path.join(__dirname, "Workspace")));
app.use("/Enterance", express.static(path.join(__dirname, "Enterance")));

// ======================
// 📧 Email Transporter (Gmail)
// ======================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// 🌐 Routes
// ======================

// Default route → register page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Enterance", "register.html"));
});

// 🟢 REGISTER — Save user + send 6-digit verification code
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    global.tempUser = { username, email, password: hashedPassword, ip, verificationCode };

    await transporter.sendMail({
      from: `"GainChat Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your GainChat Verification Code",
      html: `
        <h2>Hello ${username},</h2>
        <p>Welcome to GainChat! Here is your verification code:</p>
        <h1 style="font-size: 32px; letter-spacing: 10px; color: #00b37d;">${verificationCode}</h1>
        <p>Enter this code in the app to verify your email.<br>
        It will expire in 10 minutes.</p>
      `,
    });

    res.status(201).json({ message: "✅ Verification code sent to your Gmail." });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟣 VERIFY — Check 6-digit code
app.post("/api/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!global.tempUser)
      return res.status(400).json({ message: "No pending verification" });

    if (global.tempUser.email !== email)
      return res.status(400).json({ message: "Email mismatch" });

    if (global.tempUser.verificationCode !== code)
      return res.status(400).json({ message: "Invalid verification code" });

    const newUser = new User({
      username: global.tempUser.username,
      email: global.tempUser.email,
      password: global.tempUser.password,
      signupIP: global.tempUser.ip,
      verified: true,
    });

    await newUser.save();
    global.tempUser = null;

    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟠 LOGIN — Check credentials + verified
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid password" });

    if (!user.verified)
      return res.status(401).json({ message: "Please verify your email first" });

    res.json({ message: "✅ Login successful", username: user.username });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
