;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DiaryLogic = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function safeNumber(value) {
    const n = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function computeEntryTotals(entry) {
    const amountGram = Math.round(safeNumber(entry && entry.amount_gram));
    const factor = amountGram / 100;

    return {
      kcal: safeNumber(entry && entry.custom_kcal) * factor,
      protein: safeNumber(entry && entry.custom_protein) * factor,
      fat: safeNumber(entry && entry.custom_fat) * factor,
      carbs: safeNumber(entry && entry.custom_carbs) * factor,
    };
  }

  // Группировка по meal_type_name + подсчёт сумм БЖУ/ккал по дню.
  function aggregateDiary(entries) {
    const list = Array.isArray(entries) ? entries : [];

    const grouped = {};
    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    list.forEach((entry) => {
      const mealName = (entry && entry.meal_type_name) || 'Неизвестно';
      if (!grouped[mealName]) grouped[mealName] = [];
      grouped[mealName].push(entry);

      const totals = computeEntryTotals(entry);
      totalKcal += totals.kcal;
      totalProtein += totals.protein;
      totalFat += totals.fat;
      totalCarbs += totals.carbs;
    });

    return {
      grouped,
      totals: {
        kcal: totalKcal,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
      },
    };
  }

  return { aggregateDiary, computeEntryTotals };
});

