(function () {
  const DEFAULT_PROFILE = {
    profileName: "Mi perfil",
    sex: "male",
    age: 30,
    height: 178,
    weight: 78,
    activity: "moderate",
    goal: "maintain",
    trainingDays: 3,
    steps: 8000,
    proteinPerKg: 2,
    fatPerKg: 0.8
  };

  const ACTIVITY_LEVELS = [
    { id: "sedentary", label: "Sedentario", multiplier: 1.2 },
    { id: "light", label: "Ligero", multiplier: 1.375 },
    { id: "moderate", label: "Moderado", multiplier: 1.55 },
    { id: "high", label: "Alto", multiplier: 1.725 }
  ];

  const GOALS = [
    { id: "cut", label: "Perder grasa", calorieDelta: -0.15 },
    { id: "maintain", label: "Mantener", calorieDelta: 0 },
    { id: "gain", label: "Ganar masa", calorieDelta: 0.1 }
  ];

  const TRAINING_TYPES = [
    { id: "none", label: "Sin entreno" },
    { id: "strength", label: "Fuerza" },
    { id: "cardio", label: "Cardio" },
    { id: "mixed", label: "Mixto" }
  ];

  const INTENSITY_LEVELS = [
    { id: "light", label: "Suave" },
    { id: "normal", label: "Normal" },
    { id: "hard", label: "Duro" }
  ];

  const DEFAULT_MEALS = ["Comida 1"];

  const BASE_FOODS = [
    {
      id: "salmon",
      name: "Salmón",
      aliases: ["salmon", "salmón"],
      kcal: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      fiber: 0,
      servingLabel: "filete",
      servingGrams: 180
    },
    {
      id: "chicken",
      name: "Pechuga de pollo",
      aliases: ["pollo", "pechuga", "pechuga de pollo"],
      kcal: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      servingLabel: "filete",
      servingGrams: 160
    },
    {
      id: "turkey",
      name: "Pavo",
      aliases: ["pavo"],
      kcal: 135,
      protein: 29,
      carbs: 0,
      fat: 1.5,
      fiber: 0,
      servingLabel: "ración",
      servingGrams: 150
    },
    {
      id: "natural-tuna-drained",
      name: "Atún al natural (escurrido)",
      aliases: ["atun", "atún", "atun natural", "atún natural", "atun claro", "atún claro", "atun escurrido", "atún escurrido"],
      kcal: 98,
      protein: 21,
      carbs: 0.9,
      fat: 1.2,
      fiber: 0,
      servingLabel: "lata",
      servingGrams: 60
    },
    {
      id: "egg",
      name: "Huevo",
      aliases: ["huevo", "huevos"],
      kcal: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      servingLabel: "huevo",
      servingGrams: 60
    },
    {
      id: "gnocchi",
      name: "Ñoquis",
      aliases: ["ñoquis", "gnocchi", "gnocchis"],
      kcal: 150,
      protein: 4,
      carbs: 31,
      fat: 0.5,
      fiber: 2,
      servingLabel: "plato",
      servingGrams: 220
    },
    {
      id: "potato",
      name: "Patata cocida",
      aliases: ["patata", "patatas", "papa", "papas", "patata cocida"],
      kcal: 87,
      protein: 1.9,
      carbs: 20,
      fat: 0.1,
      fiber: 1.8,
      servingLabel: "patata mediana",
      servingGrams: 180
    },
    {
      id: "rice",
      name: "Arroz (crudo)",
      aliases: ["arroz", "arroz crudo", "arroz seco", "arroz antes de cocer"],
      kcal: 365,
      protein: 7.1,
      carbs: 80,
      fat: 0.7,
      fiber: 1.3,
      servingLabel: "ración",
      servingGrams: 80
    },
    {
      id: "pasta",
      name: "Pasta cocida",
      aliases: ["pasta", "macarrones", "espaguetis"],
      kcal: 155,
      protein: 5.8,
      carbs: 31,
      fat: 0.9,
      fiber: 1.8,
      servingLabel: "plato",
      servingGrams: 200
    },
    {
      id: "bread",
      name: "Pan",
      aliases: ["pan", "rebanada", "rodaja de pan", "rodajas de pan"],
      kcal: 265,
      protein: 9,
      carbs: 49,
      fat: 3.2,
      fiber: 2.7,
      servingLabel: "rodaja",
      servingGrams: 28
    },
    {
      id: "oats",
      name: "Avena",
      aliases: ["avena", "copos de avena"],
      kcal: 389,
      protein: 16.9,
      carbs: 66,
      fat: 6.9,
      fiber: 10.6,
      servingLabel: "cuenco",
      servingGrams: 60
    },
    {
      id: "muesli-crunchy-zero",
      name: "Muesli crunchy 0%",
      aliases: ["muesli", "muesli crunchy", "muesli crunchy 0", "muesli crunchy 0%", "cereales crunchy"],
      kcal: 401,
      protein: 8.8,
      carbs: 52,
      fat: 12,
      fiber: 23,
      servingLabel: "ración",
      servingGrams: 40
    },
    {
      id: "oat-crunchy-rings",
      name: "Avena crunchy",
      aliases: ["avena crunchy", "anillos de avena", "cereales avena", "avena integral crunchy"],
      kcal: 387,
      protein: 13,
      carbs: 66,
      fat: 5.8,
      fiber: 9.5,
      servingLabel: "ración",
      servingGrams: 40
    },
    {
      id: "banana",
      name: "Plátano",
      aliases: ["platano", "plátano", "banana"],
      kcal: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      servingLabel: "pieza",
      servingGrams: 120
    },
    {
      id: "blueberries",
      name: "Arándanos",
      aliases: ["arandanos", "arándanos", "blueberries", "mirtillos"],
      kcal: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      fiber: 2.4,
      servingLabel: "puñado",
      servingGrams: 100
    },
    {
      id: "watermelon",
      name: "Sandía",
      aliases: ["sandia", "sandía", "watermelon"],
      kcal: 30,
      protein: 0.6,
      carbs: 7.6,
      fat: 0.2,
      fiber: 0.4,
      servingLabel: "tajada",
      servingGrams: 250
    },
    {
      id: "melon",
      name: "Melón",
      aliases: ["melon", "melón", "cantalupo", "cantaloupe"],
      kcal: 34,
      protein: 0.8,
      carbs: 8.2,
      fat: 0.2,
      fiber: 0.9,
      servingLabel: "tajada",
      servingGrams: 200
    },
    {
      id: "greek-yogurt",
      name: "Kéfir natural",
      aliases: ["kefir", "kéfir", "kefir natural", "kéfir natural", "yogur", "yogurt"],
      kcal: 64,
      protein: 3.3,
      carbs: 4.8,
      fat: 3.5,
      fiber: 0,
      servingLabel: "vaso",
      servingGrams: 200
    },
    {
      id: "lentils",
      name: "Lentejas cocidas",
      aliases: ["lentejas", "lenteja", "lentejas cocidas"],
      kcal: 116,
      protein: 9,
      carbs: 20,
      fat: 0.4,
      fiber: 7.9,
      servingLabel: "plato",
      servingGrams: 250
    },
    {
      id: "cherry-tomato",
      name: "Tomate cherry",
      aliases: ["tomate", "tomates", "tomate cherry", "tomates cherry", "cherry", "cherrys"],
      kcal: 18,
      protein: 0.9,
      carbs: 3.9,
      fat: 0.2,
      fiber: 1.2,
      servingLabel: "puñado",
      servingGrams: 100
    },
    {
      id: "olive-oil",
      name: "Aceite de oliva",
      aliases: ["aceite", "aceite oliva", "aceite de oliva"],
      kcal: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      servingLabel: "cucharada",
      servingGrams: 10
    },
    {
      id: "peanut-butter",
      name: "Crema de cacahuete",
      aliases: ["crema cacahuete", "crema de cacahuete", "mantequilla de cacahuete", "peanut butter"],
      kcal: 597,
      protein: 22.5,
      carbs: 22.3,
      fat: 51.1,
      fiber: 5,
      servingLabel: "cucharada",
      servingGrams: 15
    },
    {
      id: "avocado",
      name: "Aguacate",
      aliases: ["aguacate", "palta"],
      kcal: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7,
      servingLabel: "medio",
      servingGrams: 100
    },
    {
      id: "fresh-cheese",
      name: "Queso fresco batido",
      aliases: ["queso fresco", "queso fresco batido"],
      kcal: 46,
      protein: 8,
      carbs: 3.5,
      fat: 0.2,
      fiber: 0,
      servingLabel: "vaso",
      servingGrams: 200
    },
    {
      id: "whey-protein-scoop",
      name: "Scoop de proteína",
      aliases: ["scoop", "proteina", "proteína", "whey", "whey protein", "proteina whey", "proteína whey", "polvo de proteina"],
      kcal: 380,
      protein: 80,
      carbs: 8,
      fat: 4,
      fiber: 0,
      servingLabel: "scoop",
      servingGrams: 30
    },
    {
      id: "mahon-cheese",
      name: "Queso Mahón",
      aliases: ["mahon", "mahón", "queso mahon", "queso mahón"],
      kcal: 400,
      protein: 25,
      carbs: 1.5,
      fat: 33,
      fiber: 0,
      servingLabel: "porción",
      servingGrams: 30
    },
    {
      id: "roquefort-cheese",
      name: "Queso Roquefort",
      aliases: ["roquefort", "queso roquefort", "queso azul roquefort"],
      kcal: 369,
      protein: 21.5,
      carbs: 2,
      fat: 30.6,
      fiber: 0,
      servingLabel: "porción",
      servingGrams: 30
    },
    {
      id: "entrepinares-matured-mixed-cheese",
      name: "Queso mezcla madurado Entrepinares",
      aliases: [
        "entrepinares",
        "queso entrepinares",
        "queso mezcla",
        "queso de mezcla",
        "queso mezcla madurado",
        "queso mercadona"
      ],
      kcal: 474,
      protein: 27,
      carbs: 1.5,
      fat: 40,
      fiber: 0,
      servingLabel: "porción",
      servingGrams: 30
    }
  ];

  const EQUIVALENCE_SETS = {
    protein: ["salmon", "chicken", "turkey", "natural-tuna-drained", "whey-protein-scoop"],
    carbs: ["potato", "rice", "gnocchi", "bread", "oat-crunchy-rings"],
    fat: ["olive-oil", "avocado", "salmon", "peanut-butter"]
  };

  window.LeftEatData = {
    DEFAULT_PROFILE,
    ACTIVITY_LEVELS,
    GOALS,
    TRAINING_TYPES,
    INTENSITY_LEVELS,
    DEFAULT_MEALS,
    BASE_FOODS,
    EQUIVALENCE_SETS
  };
})();
