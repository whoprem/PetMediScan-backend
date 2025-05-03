// server.js
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI|| "mongodb://localhost:27017/petmedscan";
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const User = require("./models/User.js"); // add near other imports
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Shop = require("./models/shop.js");
const cors = require('cors');
const app = express();
const upload = multer({ dest: "uploads/" });
const path = require('path');
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: "Username already exists" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, "your_jwt_secret", { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const { symptom } = req.body;
    const { lat, lon } = req.query;

    let diagnosis = "example diagnosis";
    let medicine = "Paracetamol";

    // Simulate AI response
    if (symptom) {
      // You can replace this with a real AI API later
      diagnosis = "Detected issue based on: " + symptom;
      medicine = "SampleMedicine for " + symptom;
    }

    const nearbyShops = await Shop.find({
      "medicines.name": medicine,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lon, lat] },
          $maxDistance: 5000,
        },
      },
    });

    const shopList = nearbyShops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      address: shop.address,
    }));

    res.json({
      diagnosis : "fever",
      medicine: "paracetamol",
      shops:  nearbyShops.length > 0 ? nearbyShops : [
        { _id: "1", name: "City Pharmacy", address: "Main St" },
        { _id: "2", name: "HealthPlus", address: "Market Rd" }
      ]
    });
  } catch (error) {
    console.error("Error during analysis:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});



app.listen(5000,'0.0.0.0', () => console.log("Server running on port 5000"));
