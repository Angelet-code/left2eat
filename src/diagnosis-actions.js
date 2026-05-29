(function () {
  function mealFoods(meal) {
    return Array.isArray(meal?.foods)
      ? meal.foods
      : Array.isArray(meal?.items) ? meal.items : [];
  }

  function ensureMealItems(meal) {
    meal.items = Array.isArray(meal.items)
      ? meal.items
      : Array.isArray(meal.foods) ? meal.foods : [];
    delete meal.foods;
    return meal.items;
  }

  function setMealFoods(meal, foods) {
    meal.items = foods;
    delete meal.foods;
  }

  function targetMealForSuggestion(day, createMeal) {
    day.meals = Array.isArray(day.meals) ? day.meals : [];
    const createdMeal = !day.meals.length;
    if (createdMeal) day.meals.push(createMeal("Comida 1"));

    return {
      meal: day.meals.find((meal) => !mealFoods(meal).length)
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
    ensureMealItems(meal).push(item);
    return item;
  }

  function removeItemFromMeal(day, mealId, itemId, options = {}) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    const mealIndex = meals.findIndex((meal) => meal.id === mealId);
    const meal = meals[mealIndex];
    if (!meal) return { removed: false, removedMeal: false };

    const items = mealFoods(meal);
    if (!items.some((item) => item.id === itemId)) return { removed: false, removedMeal: false };

    setMealFoods(meal, items.filter((item) => item.id !== itemId));
    const shouldRemoveMeal = Boolean(options.removeCreatedMeal) && !mealFoods(meal).length;
    if (shouldRemoveMeal) meals.splice(mealIndex, 1);

    return { removed: true, removedMeal: shouldRemoveMeal };
  }

  window.LeftEatDiagnosisActions = {
    addFoodToMeal,
    removeItemFromMeal,
    targetMealForSuggestion
  };
})();
