;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalculatorLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function calculateBmrHarris(params) {
    const { gender, age, height, weight } = params;
    if (gender === 'male') {
      return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
    }
    return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
  }

  function calculateBmrMifflin(params) {
    const { gender, age, height, weight } = params;
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    }
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  function calculateTdee(params) {
    const { bmr, activity, goal } = params;
    let tdee = bmr * activity;
    if (goal === 'loss') tdee *= 0.9;
    else if (goal === 'gain') tdee *= 1.1;
    return tdee;
  }

  function calculateMacroPercents(goal) {
    if (goal === 'loss') return { protein: 0.4, fat: 0.25, carbs: 0.35 };
    if (goal === 'gain') return { protein: 0.3, fat: 0.2, carbs: 0.5 };
    return { protein: 0.3, fat: 0.3, carbs: 0.4 };
  }

  function calculateMacrosKcal(tdee, percents) {
    return {
      proteinKcal: Math.round(tdee * percents.protein),
      fatKcal: Math.round(tdee * percents.fat),
      carbsKcal: Math.round(tdee * percents.carbs),
    };
  }

  function calculateBmi(params) {
    const { heightCm, weight } = params;
    const heightM = heightCm / 100;
    if (!heightM) return 0;
    return Number((weight / (heightM * heightM)).toFixed(2));
  }

  return {
    calculateBmrHarris,
    calculateBmrMifflin,
    calculateTdee,
    calculateMacroPercents,
    calculateMacrosKcal,
    calculateBmi,
  };
});

