const mongoose = require('mongoose');

const nutritionalDBSchema = new mongoose.Schema({
  standardName: {
    type: String,
    required: true,
    trim: true
  },
  dietaryFlags: {
    type: [String],
    default: [] // e.g., ['is_beef', 'is_pork', 'is_dairy', 'is_animal_product', 'is_gluten']
  },
  densityGramPerMl: {
    type: Number,
    default: 1.0 // For volume-to-weight front-end conversions
  },
  waterContentPercentage: {
    type: Number,
    required: true,
    default: 0.0 // 0 to 100, crucial for moisture loss equations
  },
  lipidAbsorptionFactor: {
    type: Number,
    required: true,
    default: 0.0 // Crucial for frying equations
  },
  baseMacrosPer100g: {
    calories: { type: Number, required: true, default: 0 },
    protein: { type: Number, required: true, default: 0 },
    carbs: { type: Number, required: true, default: 0 },
    fats: { type: Number, required: true, default: 0 }
  }
}, {
  timestamps: true
});

// Text index on standardName for fast ingredient search
nutritionalDBSchema.index({ standardName: 'text' });

module.exports = mongoose.model('NutritionalDB', nutritionalDBSchema);
