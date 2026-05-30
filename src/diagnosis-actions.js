(function () {
  const MealItems = window.LeftEatMealItems;

  function targetMealForSuggestion(day, createMeal) {
    day.meals = Array.isArray(day.meals) ? day.meals : [];
    const createdMeal = !day.meals.length;
    if (createdMeal) day.meals.push(createMeal("Comida 1"));

    return {
      meal: day.meals.find((meal) => !MealItems.list(meal).length)
        || day.meals[day.meals.length - 1],
      createdMeal
    };
  }

  function addFoodToMeal(meal, food, grams, createItemId) {
    const item = {
      id: createItemId(),
      foodId: food.id,
      grams
    };
    MealItems.ensure(meal).push(item);
    return item;
  }

  function removeItemFromMeal(day, mealId, itemId, options = {}) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    const mealIndex = meals.findIndex((meal) => meal.id === mealId);
    const meal = meals[mealIndex];
    if (!meal) return { removed: false, removedMeal: false };

    const items = MealItems.list(meal);
    if (!items.some((item) => item.id === itemId)) return { removed: false, removedMeal: false };

    MealItems.set(meal, items.filter((item) => item.id !== itemId));
    const shouldRemoveMeal = Boolean(options.removeCreatedMeal) && !MealItems.list(meal).length;
    if (shouldRemoveMeal) meals.splice(mealIndex, 1);

    return { removed: true, removedMeal: shouldRemoveMeal };
  }

  window.LeftEatDiagnosisActions = {
    addFoodToMeal,
    removeItemFromMeal,
    targetMealForSuggestion
  };
})();
