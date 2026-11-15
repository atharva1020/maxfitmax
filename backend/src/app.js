const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { calculateTargetNutrition } = require('./services/biometricService');
const { calculateRecipeMacros } = require('./services/macroEngine');

const User = require('./models/User');
const Recipe = require('./models/Recipe');
const DailyLog = require('./models/DailyLog');
const NutritionalDB = require('./models/NutritionalDB');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../../frontend')));

// Serve index.html as root page fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/macroreel';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    seedNutritionalDB();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Seed Nutritional Database with default values if empty
async function seedNutritionalDB() {
  try {
    const count = await NutritionalDB.countDocuments();
    if (count === 0) {
      const defaultIngredients = [
        {
          standardName: 'Chicken Breast (Raw)',
          dietaryFlags: ['is_animal_product'],
          densityGramPerMl: 1.04,
          waterContentPercentage: 75,
          lipidAbsorptionFactor: 0.03, // pan frying
          baseMacrosPer100g: { calories: 120, protein: 26, carbs: 0, fats: 1.5 }
        },
        {
          standardName: 'White Rice (Raw)',
          dietaryFlags: [],
          densityGramPerMl: 0.85,
          waterContentPercentage: 12,
          lipidAbsorptionFactor: 0.01,
          baseMacrosPer100g: { calories: 360, protein: 7, carbs: 79, fats: 0.6 }
        },
        {
          standardName: 'Broccoli (Raw)',
          dietaryFlags: [],
          densityGramPerMl: 0.36,
          waterContentPercentage: 89,
          lipidAbsorptionFactor: 0.05,
          baseMacrosPer100g: { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 }
        },
        {
          standardName: 'Olive Oil',
          dietaryFlags: [],
          densityGramPerMl: 0.92,
          waterContentPercentage: 0.2,
          lipidAbsorptionFactor: 1.0,
          baseMacrosPer100g: { calories: 884, protein: 0, carbs: 0, fats: 100 }
        },
        {
          standardName: 'Whole Milk',
          dietaryFlags: ['is_animal_product', 'is_dairy'],
          densityGramPerMl: 1.03,
          waterContentPercentage: 88,
          lipidAbsorptionFactor: 0.0,
          baseMacrosPer100g: { calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3 }
        },
        {
          standardName: 'Egg (Raw)',
          dietaryFlags: ['is_animal_product'],
          densityGramPerMl: 1.02,
          waterContentPercentage: 76,
          lipidAbsorptionFactor: 0.04,
          baseMacrosPer100g: { calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5 }
        },
        {
          standardName: 'Beef Ribeye (Raw)',
          dietaryFlags: ['is_animal_product', 'is_beef'],
          densityGramPerMl: 1.05,
          waterContentPercentage: 60,
          lipidAbsorptionFactor: 0.05,
          baseMacrosPer100g: { calories: 291, protein: 24, carbs: 0, fats: 22 }
        },
        {
          standardName: 'Pork Chop (Raw)',
          dietaryFlags: ['is_animal_product', 'is_pork'],
          densityGramPerMl: 1.04,
          waterContentPercentage: 68,
          lipidAbsorptionFactor: 0.04,
          baseMacrosPer100g: { calories: 231, protein: 21, carbs: 0, fats: 16 }
        }
      ];

      await NutritionalDB.insertMany(defaultIngredients);
      console.log('Successfully seeded default NutritionalDB items!');
    }
  } catch (err) {
    console.error('Error seeding NutritionalDB:', err);
  }
}

// ------------------- API ROUTES -------------------

// 1. User Biometric Onboarding Endpoint
app.post('/api/v1/users/onboard', async (req, res) => {
  try {
    const { username, email, password, biometrics, dietaryModes } = req.body;

    // Run Biometric calculations
    const targets = calculateTargetNutrition(biometrics);

    // Create user record
    const newUser = new User({
      username,
      email,
      passwordHash: password, // In production, bcrypt.hashSync(password, 10)
      biometrics,
      dietaryModes: dietaryModes || ['none'],
      calculatedTargets: targets
    });

    await newUser.save();
    return res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: newUser
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Recipe Calculation Engine (Moisture Loss & Lipids)
app.post('/api/v1/recipes/calculate', async (req, res) => {
  try {
    const { ingredients, cookingMethod, baseYieldServings } = req.body;
    const result = await calculateRecipeMacros(ingredients, cookingMethod, baseYieldServings);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Creator Upload Recipe Endpoint
app.post('/api/v1/recipes', async (req, res) => {
  try {
    const { creatorId, videoId, title, baseYieldServings, ingredients, cookingMethod, structuralTimeline } = req.body;

    // Run recipe macro engine calculations
    const macroResults = await calculateRecipeMacros(ingredients, cookingMethod, baseYieldServings);

    const newRecipe = new Recipe({
      creatorId,
      videoId,
      title,
      baseYieldServings,
      ingredients,
      cookingMethod,
      autoGeneratedDietaryTags: macroResults.autoGeneratedDietaryTags,
      calculatedFinalMacros: {
        totalCookedWeightGrams: macroResults.totalCookedWeightGrams,
        caloriesPerServing: macroResults.caloriesPerServing,
        proteinPerServing: macroResults.proteinPerServing,
        carbsPerServing: macroResults.carbsPerServing,
        fatsPerServing: macroResults.fatsPerServing
      },
      structuralTimeline
    });

    await newRecipe.save();
    return res.status(201).json({ success: true, data: newRecipe });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Get recipes (supporting optional dietary masking)
app.get('/api/v1/recipes', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.dietaryModes && !user.dietaryModes.includes('none')) {
        // Hard masking algorithms for dietary exclusions
        const conditions = [];

        user.dietaryModes.forEach(mode => {
          if (mode === 'hindu_no_beef') {
            conditions.push({ autoGeneratedDietaryTags: { $ne: 'contains_beef' } });
          } else if (mode === 'vegan') {
            conditions.push({ autoGeneratedDietaryTags: 'is_vegan' });
          } else if (mode === 'vegetarian') {
            conditions.push({ autoGeneratedDietaryTags: 'is_vegetarian' });
          } else if (mode === 'pescetarian') {
            conditions.push({ autoGeneratedDietaryTags: { $nin: ['contains_beef', 'contains_pork'] } }); // and could check chicken flags too
          } else if (mode === 'halal') {
            conditions.push({ autoGeneratedDietaryTags: 'is_halal' });
          }
        });

        if (conditions.length > 0) {
          query.$and = conditions;
        }
      }
    }

    const recipes = await Recipe.find(query).populate('ingredients.ingredientId');
    return res.status(200).json({ success: true, count: recipes.length, data: recipes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Daily Logging Tracker Operations
app.post('/api/v1/logs', async (req, res) => {
  try {
    const { userId, date, meals, waterIntakeMl } = req.body;
    
    // Find or create daily log
    let dailyLog = await DailyLog.findOne({ userId, date });
    if (!dailyLog) {
      dailyLog = new DailyLog({ userId, date, meals: {
        breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [], lateNightSnack: []
      }});
    }

    if (meals) {
      // Update specific slots if provided
      Object.keys(meals).forEach(slot => {
        if (dailyLog.meals[slot] !== undefined) {
          dailyLog.meals[slot] = meals[slot];
        }
      });
    }

    if (waterIntakeMl !== undefined) {
      dailyLog.waterIntakeMl = waterIntakeMl;
    }

    // Recalculate daily aggregate macros
    let aggregated = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const slots = ['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner', 'lateNightSnack'];
    for (const slot of slots) {
      const items = dailyLog.meals[slot] || [];
      for (const item of items) {
        if (item.itemType === 'raw') {
          const ing = await NutritionalDB.findById(item.itemId);
          if (ing) {
            const factor = item.consumedGrams / 100;
            aggregated.calories += (ing.baseMacrosPer100g.calories || 0) * factor;
            aggregated.protein += (ing.baseMacrosPer100g.protein || 0) * factor;
            aggregated.carbs += (ing.baseMacrosPer100g.carbs || 0) * factor;
            aggregated.fats += (ing.baseMacrosPer100g.fats || 0) * factor;
          }
        } else if (item.itemType === 'recipe') {
          const rec = await Recipe.findById(item.itemId);
          if (rec) {
            // Recipe calculatedMacros are stored PER SERVING. Consumed grams scaled against total cooked mass.
            const totalMass = rec.calculatedFinalMacros.totalCookedWeightGrams || 1;
            const portionFactor = item.consumedGrams / (totalMass / rec.baseYieldServings);
            
            aggregated.calories += rec.calculatedFinalMacros.caloriesPerServing * portionFactor;
            aggregated.protein += rec.calculatedFinalMacros.proteinPerServing * portionFactor;
            aggregated.carbs += rec.calculatedFinalMacros.carbsPerServing * portionFactor;
            aggregated.fats += rec.calculatedFinalMacros.fatsPerServing * portionFactor;
          }
        }
      }
    }

    dailyLog.dailyAggregatedTotals = {
      calories: Math.round(aggregated.calories),
      protein: Math.round(aggregated.protein),
      carbs: Math.round(aggregated.carbs),
      fats: Math.round(aggregated.fats)
    };

    await dailyLog.save();
    return res.status(200).json({ success: true, data: dailyLog });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Get user's daily log
app.get('/api/v1/logs', async (req, res) => {
  try {
    const { userId, date } = req.query;
    const dailyLog = await DailyLog.findOne({ userId, date });
    if (!dailyLog) {
      return res.status(200).json({
        success: true,
        data: {
          userId,
          date,
          meals: { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [], lateNightSnack: [] },
          waterIntakeMl: 0,
          dailyAggregatedTotals: { calories: 0, protein: 0, carbs: 0, fats: 0 }
        }
      });
    }
    return res.status(200).json({ success: true, data: dailyLog });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all ingredients for text searches
app.get('/api/v1/nutritional-db/search', async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q) {
      filter = { $text: { $search: q } };
    }
    const results = await NutritionalDB.find(filter);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// App server listener
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`MacroReel Node.js Server running on port ${PORT}`);
  });
}

module.exports = app;
