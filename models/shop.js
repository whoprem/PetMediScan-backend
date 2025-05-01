const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: String,
  address: String,
  medicines: [
    {
      name: String,
      price: Number,
    }
  ],
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

ShopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Shop", ShopSchema);
