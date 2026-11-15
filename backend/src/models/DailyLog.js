const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['raw', 'recipe'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'meals.breakfast.itemType' // dynamic ref, resolved programmatically or simple reference
  },
  consumedGrams: {
    type: Number,
    required: true
  }
}, { _id: false });

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  meals: {
    breakfast: { type: [mealItemSchema], default: [] },
    morningSnack: { type: [mealItemSchema], default: [] },
    lunch: { type: [mealItemSchema], default: [] },
    eveningSnack: { type: [mealItemSchema], default: [] },
    dinner: { type: [mealItemSchema], default: [] },
    lateNightSnack: { type: [mealItemSchema], default: [] }
  },
  waterIntakeMl: {
    type: Number,
    default: 0
  },
  dailyAggregatedTotals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Composite index for fast loading user logs by date
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
