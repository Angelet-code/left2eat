(function () {
  const MACRO_META = [
    { key: "kcal", label: "Calorías", unit: "kcal", precision: 0 },
    { key: "protein", label: "Proteína", unit: "g", precision: 0 },
    { key: "carbs", label: "Carbohidratos", unit: "g", precision: 0 },
    { key: "fat", label: "Grasas", unit: "g", precision: 0 },
    { key: "fiber", label: "Fibra", unit: "g", precision: 0 }
  ];

  function number(value, fallback = 0) {
    if (value === "" || value === null || value === undefined) return fallback;
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function round(value, precision = 0) {
    const factor = 10 ** precision;
    return Math.round((number(value) + Number.EPSILON) * factor) / factor;
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function formatNumber(value, precision = 0) {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: precision,
      minimumFractionDigits: precision
    }).format(round(value, precision));
  }

  function getGoal(profile) {
    return window.LeftEatData.GOALS.find((item) => item.id === profile.goal)
      || window.LeftEatData.GOALS[1];
  }

  function estimateActivityMultiplier(profile) {
    const trainingDays = Math.max(number(profile.trainingDays), 0);
    const steps = Math.max(number(profile.steps), 0);
    const trainingBoost = Math.min(trainingDays, 7) * 0.045;
    const stepBoost = Math.max(Math.min((steps - 5000) / 10000, 1.4), -0.25) * 0.18;
    return Math.max(1.2, Math.min(1.9, 1.25 + trainingBoost + stepBoost));
  }

  function dayContext(day) {
    return {
      training: day?.context?.training || "none",
      intensity: day?.context?.intensity || "normal",
      steps: day?.context?.steps
    };
  }

  function calculateProteinPerKg(profile, context) {
    const goal = profile.goal || "maintain";
    if (goal === "cut") return context.training === "none" ? 1.9 : 2;
    if (goal === "gain") return context.training === "none" ? 1.7 : 1.8;
    return context.training === "none" ? 1.7 : 1.8;
  }

  function calculateDailyCalorieDelta(profile, context) {
    let delta = getGoal(profile).calorieDelta;
    if (context.training === "none") delta -= profile.goal === "gain" ? 0 : 0.04;
    if (context.training === "cardio" || context.training === "mixed") delta += 0.03;
    if (context.intensity === "light") delta -= 0.02;
    if (context.intensity === "hard" && context.training !== "none") delta += 0.03;

    const plannedSteps = Math.max(number(profile.steps), 1);
    const actualSteps = Math.max(number(context.steps, plannedSteps), 0);
    const stepDifference = actualSteps - plannedSteps;
    if (stepDifference > 3000) delta += 0.025;
    if (stepDifference < -3000) delta -= 0.025;

    return Math.max(-0.25, Math.min(0.18, delta));
  }

  function calculateFatPerKg(context) {
    if (context.training === "none") return 1.02;
    if (context.training === "strength") return 0.92;
    if (context.training === "cardio") return 0.82;
    return 0.86;
  }

  function calculateTargets(profile, day) {
    const weight = Math.max(number(profile.weight), 1);
    const height = Math.max(number(profile.height), 1);
    const age = Math.max(number(profile.age), 1);
    const context = dayContext(day);
    const sexOffset = profile.sex === "female" ? -161 : 5;
    const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;
    const activityMultiplier = estimateActivityMultiplier(profile);
    const maintenance = bmr * activityMultiplier;
    const targetKcal = Math.max(1200, maintenance * (1 + calculateDailyCalorieDelta(profile, context)));
    const protein = weight * calculateProteinPerKg(profile, context);
    const fat = weight * calculateFatPerKg(context);
    const carbs = Math.max((targetKcal - protein * 4 - fat * 9) / 4, 0);

    return {
      kcal: round(targetKcal),
      protein: round(protein),
      carbs: round(carbs),
      fat: round(fat),
      fiber: 30,
      bmr: round(bmr),
      maintenance: round(maintenance),
      activityMultiplier: round(activityMultiplier, 2),
      context
    };
  }

  function foodMacros(food, grams) {
    const ratio = Math.max(number(grams), 0) / 100;
    return {
      kcal: food.kcal * ratio,
      protein: food.protein * ratio,
      carbs: food.carbs * ratio,
      fat: food.fat * ratio,
      fiber: (food.fiber || 0) * ratio
    };
  }

  function foodSnapshotFromItem(item) {
    const snapshot = item?.foodSnapshot;
    if (!snapshot) return null;
    const per100 = snapshot.per100 || snapshot.macrosPer100 || snapshot;
    if (!snapshot.name && !snapshot.foodName && !snapshot.foodNameSnapshot) return null;

    return {
      id: item.foodId || snapshot.foodId || "snapshot-food",
      name: snapshot.name || snapshot.foodName || snapshot.foodNameSnapshot,
      kcal: number(per100.kcal),
      protein: number(per100.protein),
      carbs: number(per100.carbs),
      fat: number(per100.fat),
      fiber: number(per100.fiber)
    };
  }

  function zeroMacros() {
    return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  function addMacros(total, macros) {
    MACRO_META.forEach(({ key }) => {
      total[key] += number(macros[key]);
    });
    return total;
  }

  function mealFoods(meal) {
    return Array.isArray(meal.foods)
      ? meal.foods
      : Array.isArray(meal.items) ? meal.items : [];
  }

  function aggregateDay(day, foods) {
    const total = zeroMacros();
    const meals = (day.meals || []).map((meal) => {
      const mealTotal = zeroMacros();
      mealFoods(meal).forEach((item) => {
        const food = findFoodById(foods, item.foodId) || foodSnapshotFromItem(item);
        if (!food) return;
        addMacros(mealTotal, foodMacros(food, item.grams));
      });
      addMacros(total, mealTotal);
      return { ...meal, total: mealTotal };
    });

    return { total, meals };
  }

  function remaining(total, targets) {
    return MACRO_META.reduce((acc, { key }) => {
      acc[key] = number(targets[key]) - number(total[key]);
      return acc;
    }, {});
  }

  function findFoodById(foods, id) {
    return foods.find((food) => food.id === id);
  }

  function findFoodByName(foods, query) {
    const normalized = normalize(query);
    if (!normalized) return null;

    const exact = foods.find((food) => {
      const names = [food.name, ...(food.aliases || [])].map(normalize);
      return names.includes(normalized);
    });
    if (exact) return exact;

    return foods.find((food) => {
      const names = [food.name, ...(food.aliases || [])].map(normalize);
      return names.some((name) => name.includes(normalized) || normalized.includes(name));
    }) || null;
  }

  function equivalentAmount(food, macro, gramsNeeded) {
    const macroPerGram = number(food[macro]) / 100;
    if (macroPerGram <= 0 || gramsNeeded <= 0) return null;

    const grams = gramsNeeded / macroPerGram;
    const servingGrams = number(food.servingGrams);
    return {
      food,
      grams: round(grams),
      servings: servingGrams > 0 ? grams / servingGrams : 0
    };
  }

  function buildEquivalences(remainingMacros, foods) {
    const sets = window.LeftEatData.EQUIVALENCE_SETS;
    return Object.entries(sets).reduce((acc, [macro, ids]) => {
      const gramsNeeded = Math.max(number(remainingMacros[macro]), 0);
      acc[macro] = ids
        .map((id) => findFoodById(foods, id))
        .filter(Boolean)
        .map((food) => equivalentAmount(food, macro, gramsNeeded))
        .filter(Boolean);
      return acc;
    }, {});
  }

  function formatWithUnit(value, meta) {
    return `${formatNumber(value, meta.precision)} ${meta.unit}`;
  }

  function targetRange(key, target) {
    const ranges = {
      kcal: { min: 0.95, max: 1.05 },
      protein: { min: 0.9, max: 1.15 },
      carbs: { min: 0.85, max: 1.15 },
      fat: { min: 0.85, max: 1.15 },
      fiber: { min: 1, max: 1.6, minimum: true }
    };
    const config = ranges[key] || { min: 0.9, max: 1.1 };

    return {
      min: round(target * config.min),
      max: round(target * config.max),
      minimum: Boolean(config.minimum)
    };
  }

  function energyRangeStatus(consumed, target) {
    const meta = MACRO_META[0];
    const range = targetRange("kcal", target);
    const detail = `${formatWithUnit(consumed, meta)} / ${formatNumber(range.min, meta.precision)}-${formatWithUnit(range.max, meta)}`;

    if (consumed < range.min) {
      const missing = range.min - consumed;
      const progressToRange = range.min > 0 ? consumed / range.min : 0;
      const almostThreshold = Math.max(150, target * 0.08);
      let headline = "Queda bastante";

      if (consumed <= 0) {
        headline = "Empieza el día";
      } else if (missing <= almostThreshold) {
        headline = "Casi en rango";
      } else if (progressToRange >= 0.85) {
        headline = "Cerca del rango";
      } else if (progressToRange >= 0.55) {
        headline = "En progreso";
      }

      return {
        headline,
        metric: `${formatNumber(missing)} kcal para entrar`,
        detail
      };
    }

    if (consumed <= range.max) {
      return {
        headline: "En rango",
        metric: formatWithUnit(consumed, meta),
        detail
      };
    }

    return {
      headline: "Por encima del rango",
      metric: `+${formatNumber(consumed - range.max)} kcal`,
      detail
    };
  }

  function analyzeDailyAdvice(totals, targets) {
    const kcalRange = targetRange("kcal", targets.kcal);
    const proteinRange = targetRange("protein", targets.protein);
    const fatRange = targetRange("fat", targets.fat);
    const carbsRange = targetRange("carbs", targets.carbs);
    const fiberMissing = Math.max(targets.fiber - totals.fiber, 0);

    if (totals.kcal <= 0) {
      return {
        className: "is-neutral",
        eyebrow: "Siguiente paso",
        title: "Empieza por una comida real",
        body: "Registra el alimento principal y deja que la app ajuste el resto del día."
      };
    }

    if (totals.kcal > kcalRange.max) {
      return {
        className: "is-warn",
        eyebrow: "Ajuste de hoy",
        title: "No añadiría más grasa",
        body: "Ya estás por encima del rango calórico; prioriza verduras, fruta o alimentos muy magros si comes algo más."
      };
    }

    if (fiberMissing >= 10) {
      return {
        className: "is-fiber",
        eyebrow: "Prioridad",
        title: "La fibra es el punto débil",
        body: "Metería fruta, verdura o legumbre antes que sumar más queso, aceite o frutos secos."
      };
    }

    if (totals.protein < proteinRange.min) {
      return {
        className: "is-protein",
        eyebrow: "Prioridad",
        title: "Falta proteína útil",
        body: "Encaja mejor algo magro como pollo, atún, merluza, kéfir o un scoop de proteína."
      };
    }

    if (totals.fat > fatRange.max) {
      return {
        className: "is-warn",
        eyebrow: "Cuidado",
        title: "Grasa algo alta",
        body: "Para completar el día, evitaría aceite, quesos grasos y frutos secos."
      };
    }

    if (totals.carbs < carbsRange.min) {
      return {
        className: "is-carbs",
        eyebrow: "Pendiente",
        title: "Quedan carbohidratos",
        body: "Arroz, patata, pan o fruta encajan mejor que añadir más grasa."
      };
    }

    return {
      className: "is-good",
      eyebrow: "Lectura",
      title: "Día bien encarrilado",
      body: "Proteína y energía están controladas. Si añades algo más, que sea ligero y con fibra."
    };
  }

  function remainingToRanges(totals, targets) {
    return MACRO_META.reduce((acc, meta) => {
      const range = targetRange(meta.key, targets[meta.key] || 0);
      acc[meta.key] = Math.max(range.min - (totals[meta.key] || 0), 0);
      return acc;
    }, {});
  }

  function nutritionFocusForMacro(meta, totals, targets) {
    const consumed = totals[meta.key] || 0;
    const target = targets[meta.key] || 0;
    const range = targetRange(meta.key, target);

    if (range.minimum) {
      const missing = Math.max(range.min - consumed, 0);
      return {
        className: `macro-${meta.key} ${missing ? "is-info" : "is-good"}`,
        label: meta.label,
        value: missing ? `${formatNumber(missing, meta.precision)} ${meta.unit}` : "OK",
        detail: missing ? "para mínimo" : "cubierto",
        priority: missing ? 120 + missing : 5
      };
    }

    if (consumed < range.min) {
      const missing = range.min - consumed;
      return {
        className: `macro-${meta.key} is-info`,
        label: meta.label,
        value: `${formatNumber(missing, meta.precision)} ${meta.unit}`,
        detail: "por cubrir",
        priority: 90 + missing
      };
    }

    if (consumed > range.max) {
      const over = consumed - range.max;
      return {
        className: `macro-${meta.key} is-warn`,
        label: meta.label,
        value: `+${formatNumber(over, meta.precision)} ${meta.unit}`,
        detail: "pasado",
        priority: 80 + over
      };
    }

    return {
      className: `macro-${meta.key} is-good`,
      label: meta.label,
      value: "OK",
      detail: "en rango",
      priority: 10
    };
  }

  function buildNutritionFocus(totals, targets, energy) {
    const kcalRange = targetRange("kcal", targets.kcal);
    const calorieClass = totals.kcal > kcalRange.max
      ? "is-warn"
      : totals.kcal >= kcalRange.min ? "is-good" : "is-info";

    return [
      {
        className: `macro-kcal ${calorieClass}`,
        label: "Calorías",
        value: energy.metric,
        detail: energy.headline
      },
      ...MACRO_META
        .filter((meta) => meta.key !== "kcal")
        .map((meta) => nutritionFocusForMacro(meta, totals, targets))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2)
    ];
  }

  function foodById(foods, id) {
    return foods.find((food) => food.id === id);
  }

  function macroFoodScore(food, macro) {
    if (macro === "protein") return number(food.protein) * 7 - number(food.fat) * 1.5 - number(food.kcal) / 120;
    if (macro === "carbs") return number(food.carbs) * 4 + number(food.fiber) * 2 - number(food.fat) * 2;
    if (macro === "fiber") return number(food.fiber) * 8 - number(food.fat) - number(food.kcal) / 180;
    if (macro === "light") return number(food.protein) * 2 + number(food.fiber) * 3 - number(food.kcal) / 40 - number(food.fat) * 2;
    return number(food.kcal) / 25 + number(food.carbs) + number(food.fat) * 2;
  }

  function rankedFoods(foods, macro, limit = 3) {
    return [...foods]
      .filter((food) => macroFoodScore(food, macro) > 0)
      .sort((a, b) => {
        const scoreDiff = macroFoodScore(b, macro) - macroFoodScore(a, macro);
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
      })
      .slice(0, limit);
  }

  function foodSuggestion(food, reason) {
    const grams = Math.max(number(food.servingGrams, 100), 1);
    return {
      foodId: food.id,
      name: food.name,
      grams,
      reason,
      label: food.name,
      detail: `${formatNumber(grams)} g · ${reason}`
    };
  }

  function suggestionSet(foods, entries, fallbackMacro, options = {}) {
    const usedFoodIds = options.usedFoodIds || new Set();
    const alreadySuggested = new Set();
    const suggestions = entries
      .map(([id, reason]) => {
        if (usedFoodIds.has(id)) return null;
        const food = foodById(foods, id);
        if (!food || alreadySuggested.has(food.id)) return null;
        alreadySuggested.add(food.id);
        return foodSuggestion(food, reason);
      })
      .filter(Boolean);

    rankedFoods(foods.filter((food) => !usedFoodIds.has(food.id)), fallbackMacro, 8).forEach((food) => {
      if (!alreadySuggested.has(food.id)) {
        alreadySuggested.add(food.id);
        suggestions.push(foodSuggestion(food, "opción compatible"));
      }
    });

    return suggestions.slice(0, 3);
  }

  function diagnosisSuggestions(mode, foods, options = {}) {
    if (mode === "empty") return [];

    const sets = {
      over: [["cherry-tomato", "volumen ligero"], ["green-garlic", "fibra y volumen"], ["watermelon", "fruta ligera"]],
      protein: [["turkey", "proteína magra"], ["natural-tuna-drained", "rápido y bajo en grasa"], ["chicken", "proteína magra"], ["fresh-cheese", "proteína simple"], ["whey-protein-scoop", "proteína rápida"]],
      fiber: [["lentils", "fibra y legumbre"], ["green-garlic", "fibra y volumen"], ["oats", "integral saciante"], ["blueberries", "fruta ligera"]],
      fat: [["natural-tuna-drained", "proteína magra"], ["cherry-tomato", "volumen ligero"], ["green-garlic", "fibra y volumen"]],
      energy: [["potato", "carbohidrato medible"], ["pasta", "base energética"], ["rice", "base energética"], ["bread", "refuerzo sencillo"]],
      carbs: [["potato", "carbohidrato medible"], ["pasta", "base energética"], ["banana", "fruta rápida"], ["gnocchi", "carbohidrato sencillo"]],
      good: [["green-garlic", "fibra ligera"], ["blueberries", "fruta ligera"], ["natural-tuna-drained", "proteína simple"]]
    };

    const fallback = {
      over: "light",
      protein: "protein",
      fiber: "fiber",
      fat: "light",
      energy: "carbs",
      carbs: "carbs",
      good: "light"
    };

    return suggestionSet(foods, sets[mode] || sets.good, fallback[mode] || "light", options);
  }

  function finalizeDiagnosis(diagnosis, foods, mode, options = {}) {
    return {
      ...diagnosis,
      suggestions: diagnosisSuggestions(mode, foods, options)
    };
  }

  function buildDailyDiagnosis(totals, targets, foods = [], options = {}) {
    const kcalRange = targetRange("kcal", targets.kcal);
    const proteinRange = targetRange("protein", targets.protein);
    const carbsRange = targetRange("carbs", targets.carbs);
    const fatRange = targetRange("fat", targets.fat);
    const fiberRange = targetRange("fiber", targets.fiber);
    const kcalOver = totals.kcal - kcalRange.max;
    const kcalMissing = kcalRange.min - totals.kcal;
    const proteinMissing = proteinRange.min - totals.protein;
    const carbsMissing = carbsRange.min - totals.carbs;
    const fatOver = totals.fat - fatRange.max;
    const fiberMissing = fiberRange.min - totals.fiber;

    if (totals.kcal <= 0) {
      return finalizeDiagnosis({
        className: "is-neutral",
        priority: "Sin datos",
        metric: "Primera comida",
        title: "Aún no hay suficientes datos para diagnosticar el día.",
        body: "Añade al menos una comida para ver una recomendación útil.",
        action: "Registrar primera comida"
      }, foods, "empty", options);
    }

    if (kcalOver > 0) {
      return finalizeDiagnosis({
        className: "is-warn",
        priority: "Calorías",
        metric: `+${formatNumber(kcalOver)} kcal`,
        title: "Ya estás por encima del rango recomendado.",
        body: "Mantén el resto del día ligero y evita compensaciones agresivas.",
        action: "Cerrar día ligero"
      }, foods, "over", options);
    }

    if (proteinMissing > 0) {
      const proteinStarted = totals.protein >= Math.min(30, proteinRange.min * 0.25);
      return finalizeDiagnosis({
        className: "is-protein",
        priority: "Proteína",
        metric: `${formatNumber(proteinMissing)} g`,
        title: proteinStarted ? "Proteína empezada; falta completar." : "Falta una fuente de proteína.",
        body: proteinStarted
          ? "Ya hay proteína en el día. Completa lo que falta sin repetir por inercia."
          : "Prioriza una fuente proteica en la próxima comida.",
        action: proteinStarted ? "Completar proteína" : "Añadir proteína"
      }, foods, "protein", options);
    }

    if (fiberMissing >= 10) {
      return finalizeDiagnosis({
        className: "is-fiber",
        priority: "Fibra",
        metric: `${formatNumber(fiberMissing)} g`,
        title: "Te falta fibra.",
        body: "Añade fruta, verdura, legumbre o cereal integral en alguna comida pendiente.",
        action: "Ajustar próxima comida"
      }, foods, "fiber", options);
    }

    if (fatOver > 0) {
      return finalizeDiagnosis({
        className: "is-warn",
        priority: "Grasas",
        metric: `+${formatNumber(fatOver)} g`,
        title: "Vas alto en grasas.",
        body: "En la próxima comida prioriza proteína magra, verduras y carbohidratos sencillos de controlar.",
        action: "Ajustar próxima comida"
      }, foods, "fat", options);
    }

    if (kcalMissing > 150) {
      return finalizeDiagnosis({
        className: "is-energy",
        priority: "Calorías",
        metric: `${formatNumber(kcalMissing)} kcal`,
        title: "Te faltan calorías.",
        body: "Añade una comida completa o refuerza la próxima con carbohidratos y grasas de calidad.",
        action: "Ajustar próxima comida"
      }, foods, "energy", options);
    }

    if (carbsMissing > 20) {
      return finalizeDiagnosis({
        className: "is-carbs",
        priority: "Carbohidratos",
        metric: `${formatNumber(carbsMissing)} g`,
        title: "Te estás quedando corto en carbohidratos.",
        body: "Si aún tienes actividad pendiente, añade una fuente de carbohidratos en la próxima comida.",
        action: "Añadir carbohidratos"
      }, foods, "carbs", options);
    }

    if (fiberMissing > 6) {
      return finalizeDiagnosis({
        className: "is-fiber",
        priority: "Fibra",
        metric: `${formatNumber(fiberMissing)} g`,
        title: "Te falta fibra.",
        body: "Añade fruta, verdura, legumbre o cereal integral en alguna comida pendiente.",
        action: "Añadir fibra"
      }, foods, "fiber", options);
    }

    return finalizeDiagnosis({
      className: "is-good",
      priority: "Equilibrio",
      metric: "En rango",
      title: "Vas bien encaminado.",
      body: "Mantén el reparto actual y revisa el cierre del día después de la próxima comida.",
      action: "Mantener reparto"
    }, foods, "good", options);
  }

  function usedFoodIdsFromAggregate(aggregate) {
    const ids = new Set();
    (aggregate?.meals || []).forEach((meal) => {
      mealFoods(meal).forEach((item) => {
        if (item.foodId) ids.add(item.foodId);
      });
    });
    return ids;
  }

  function buildSummaryInsights(totals, targets, foods, aggregate = null) {
    const kcalRange = targetRange("kcal", targets.kcal);
    const energy = energyRangeStatus(totals.kcal, targets.kcal);
    const advice = analyzeDailyAdvice(totals, targets);
    const rangeLeft = remainingToRanges(totals, targets);
    const activeFoods = foods.filter((food) => !food.deletedAt);
    const diagnosis = buildDailyDiagnosis(totals, targets, activeFoods, {
      usedFoodIds: usedFoodIdsFromAggregate(aggregate)
    });

    return {
      kcalRange,
      energy,
      advice,
      diagnosis,
      focus: buildNutritionFocus(totals, targets, energy),
      rangeLeft,
      equivalences: buildEquivalences(rangeLeft, activeFoods)
    };
  }

  function summarizeDay(day, profile, foods) {
    const aggregate = aggregateDay(day, foods);
    const targets = calculateTargets(profile, day);
    const insights = buildSummaryInsights(aggregate.total, targets, foods, aggregate);

    return {
      aggregate,
      meals: aggregate.meals,
      total: aggregate.total,
      targets,
      ...insights
    };
  }

  window.LeftEatNutrition = {
    MACRO_META,
    analyzeDailyAdvice,
    aggregateDay,
    buildEquivalences,
    buildSummaryInsights,
    calculateTargets,
    energyRangeStatus,
    findFoodById,
    findFoodByName,
    foodMacros,
    formatNumber,
    normalize,
    number,
    remaining,
    round,
    summarizeDay,
    targetRange,
    zeroMacros
  };
})();
