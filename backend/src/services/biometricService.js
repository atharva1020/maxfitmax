/**
 * Calculates BMR, TDEE, and target macros (Protein, Carbs, Fats)
 * using the Mifflin-St Jeor equation.
 * 
 * @param {Object} biometrics
 * @param {number} biometrics.age - Age in years
 * @param {'male'|'female'} biometrics.sex - Biological sex
 * @param {number} biometrics.heightCm - Height in centimeters
 * @param {number} biometrics.weightKg - Weight in kilograms
 * @param {number} biometrics.activityLevel - Activity level multiplier (1.2, 1.375, 1.55, 1.725, 1.9)
 * @param {'cut'|'maintain'|'bulk'} biometrics.goal - Fitness goal
 * @returns {Object} Calculated metrics { bmr, tdee, dailyCalories, macros }
 */
function calculateTargetNutrition(biometrics) {
  const { age, sex, heightCm, weightKg, activityLevel, goal } = biometrics;

  if (!age || !sex || !heightCm || !weightKg || !activityLevel || !goal) {
    throw new Error('Missing biometrics parameters for calculations');
  }

  // 1. Calculate BMR
  let bmr = 0;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (sex === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    throw new Error('Invalid sex parameter. Must be "male" or "female".');
  }

  // 2. Calculate TDEE
  const tdee = Math.round(bmr * activityLevel);

  // 3. Determine target daily calories based on goal
  let dailyCalories = tdee;
  let proteinPerKg = 2.0;

  if (goal === 'cut') {
    dailyCalories = tdee - 500;
    proteinPerKg = 2.2; // High protein retention for cutting
  } else if (goal === 'bulk') {
    dailyCalories = tdee + 500;
    proteinPerKg = 2.2; // Protein for muscle hypertrophy
  } else {
    // maintain
    dailyCalories = tdee;
    proteinPerKg = 2.0;
  }

  // Guard against negative caloric targets
  if (dailyCalories < 1200) {
    dailyCalories = 1200; // Safe threshold minimum
  }

  // 4. Calculate Macro Splits
  // Protein: proteinPerKg * weightKg
  const proteinGrams = Math.round(proteinPerKg * weightKg);
  const proteinKcal = proteinGrams * 4;

  // Fats: 25% of daily calories
  const fatsKcal = dailyCalories * 0.25;
  const fatsGrams = Math.round(fatsKcal / 9);

  // Carbs: Remaining calories
  const remainingKcal = dailyCalories - (proteinKcal + fatsKcal);
  const carbsGrams = Math.max(0, Math.round(remainingKcal / 4));

  return {
    bmr: Math.round(bmr),
    tdee,
    dailyCalories: Math.round(dailyCalories),
    macros: {
      proteinGrams,
      carbsGrams,
      fatsGrams
    }
  };
}

module.exports = {
  calculateTargetNutrition
};
