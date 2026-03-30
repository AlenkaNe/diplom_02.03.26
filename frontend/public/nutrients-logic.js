;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutrientsLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function normalizeName(name) {
    return String(name || '').toLowerCase();
  }

  function extractCustomNutrients(food) {
    const nutrients = Array.isArray(food && food.foodNutrients) ? food.foodNutrients : [];

    const findByKeywords = (keywords) =>
      nutrients.find((n) => {
        const nName = normalizeName(n && n.name);
        return nName && keywords.some((k) => nName.includes(k));
      }) || null;

    const kcalNutrient = findByKeywords(['energy', 'калори']);
    const proteinNutrient = findByKeywords(['protein', 'белк']);
    const fatNutrient = findByKeywords(['fat', 'жир']);
    const carbsNutrient = findByKeywords(['carbohydrate', 'углевод']);

    return {
      customKcal: kcalNutrient ? kcalNutrient.amount : null,
      customProtein: proteinNutrient ? proteinNutrient.amount : null,
      customFat: fatNutrient ? fatNutrient.amount : null,
      customCarbs: carbsNutrient ? carbsNutrient.amount : null,
    };
  }

  return { extractCustomNutrients };
});

