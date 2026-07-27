const mongoose = require('mongoose');

const cardMarketSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  cardId: { type: String, required: true },
  cardName: { type: String, required: true },
  cardImage: { type: String, required: true },
  cardRarity: { type: String, required: true },
  price: { type: Number, required: true },
  listedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CardMarket', cardMarketSchema);
