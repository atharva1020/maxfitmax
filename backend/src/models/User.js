const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['consumer', 'creator', 'verified_dietician', 'admin'],
    default: 'consumer'
  },
  biometrics: {
    age: { type: Number, required: true },
    sex: { type: String, enum: ['male', 'female'], required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    activityLevel: { type: Number, required: true, default: 1.2 }, // e.g. 1.2, 1.375, 1.55
    goal: { type: String, enum: ['cut', 'maintain', 'bulk'], required: true, default: 'maintain' }
  },
  dietaryModes: {
    type: [String],
    enum: ['vegan', 'vegetarian', 'pescetarian', 'halal', 'hindu_no_beef', 'none'],
    default: ['none'],
    index: true // Indexed for feed querying masking
  },
  calculatedTargets: {
    bmr: { type: Number },
    tdee: { type: Number },
    dailyCalories: { type: Number },
    macros: {
      proteinGrams: { type: Number },
      carbsGrams: { type: Number },
      fatsGrams: { type: Number }
    }
  },
  preferences: {
    waterReminderIntervalMins: { type: Number, default: 60 },
    mealReminderTimes: {
      breakfast: { type: String, default: '08:00' },
      morningSnack: { type: String, default: '10:30' },
      lunch: { type: String, default: '13:00' },
      eveningSnack: { type: String, default: '16:30' },
      dinner: { type: String, default: '20:00' },
      lateNightSnack: { type: String, default: '22:30' }
    }
  },
  fcmToken: { type: String },
  socialGraphs: {
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  savedVault: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  creatorMetrics: {
    totalRatings: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    trustTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
