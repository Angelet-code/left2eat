(function () {
  function list(meal) {
    return Array.isArray(meal?.foods)
      ? meal.foods
      : Array.isArray(meal?.items) ? meal.items : [];
  }

  function ensure(meal) {
    meal.items = list(meal);
    delete meal.foods;
    return meal.items;
  }

  function set(meal, items) {
    meal.items = Array.isArray(items) ? items : [];
    delete meal.foods;
    return meal.items;
  }

  window.LeftEatMealItems = {
    ensure,
    list,
    set
  };
})();
