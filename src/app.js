(function () {
  const Storage = window.LeftEatStorage;
  const Nutrition = window.LeftEatNutrition;
  const Data = window.LeftEatData;
  const Icons = window.LeftEatIcons;
  const DiagnosisActions = window.LeftEatDiagnosisActions;

  let state = Storage.load();
  const uiState = {
    addFoodMealIds: new Set(),
    collapsedMealIds: new Set(),
    view: "diary",
    activeNav: "diary",
    editingFoodId: "",
    foodSearch: "",
    selectedFoodByMealId: new Map(),
    comboContext: null,
    recommendationFocus: null,
    pendingUndo: null
  };

  const refs = {
    date: document.getElementById("day-date"),
    saveDay: document.getElementById("save-day"),
    dayEyebrow: document.getElementById("day-eyebrow"),
    dayTitle: document.getElementById("day-title"),
    profileTitle: document.getElementById("profile-title"),
    profilePanelContent: document.getElementById("profile-panel-content"),
    sideNav: document.getElementById("side-nav"),
    quickSearch: document.getElementById("quick-food-search"),
    quickFoodList: document.getElementById("quick-food-list"),
    dayContext: document.getElementById("day-context"),
    macroCards: document.getElementById("macro-cards"),
    mealWorkbench: document.querySelector(".meal-workbench"),
    meals: document.getElementById("meals"),
    profileEditor: document.getElementById("profile-editor"),
    libraryPanel: document.getElementById("food-library"),
    dayInsights: document.querySelector(".day-insights"),
    historyPanel: document.querySelector(".history-panel"),
    summaryPanel: document.querySelector(".summary-panel"),
    dateActions: document.querySelector(".date-actions"),
    macroSummary: document.getElementById("macro-summary"),
    equivalences: document.getElementById("equivalences"),
    history: document.getElementById("history"),
    analysis: document.getElementById("analysis"),
    toast: document.getElementById("toast")
  };

  const PROFILE_PIXEL_AVATARS = [
    { id: "male", label: "Bosque" },
    { id: "female", label: "Cobre" },
    { id: "bald-beard", label: "Barba" },
    { id: "curly", label: "Rizos" },
    { id: "bob", label: "Noche" },
    { id: "ponytail", label: "Brisa" },
    { id: "cap", label: "Gorra" },
    { id: "silver", label: "Plata" }
  ];

  const PROFILE_PIXEL_SPRITES = {
    male: [
      [20, 9, 24, 4, "#2d251f"], [16, 13, 32, 8, "#3c3128"], [18, 21, 28, 5, "#2d251f"],
      [20, 18, 24, 21, "#e9ad82"], [16, 25, 4, 8, "#c98461"], [44, 25, 4, 8, "#c98461"],
      [23, 27, 4, 4, "#1f2738"], [37, 27, 4, 4, "#1f2738"], [30, 32, 4, 3, "#c98461"], [27, 36, 10, 3, "#8d4a3f"],
      [24, 40, 16, 5, "#e9ad82"], [16, 44, 32, 16, "#2f8c68"], [20, 44, 24, 5, "#91dfb6"],
      [24, 49, 16, 11, "#234f46"], [12, 50, 8, 10, "#2f8c68"], [44, 50, 8, 10, "#2f8c68"], [19, 60, 26, 2, "#263247"]
    ],
    female: [
      [19, 8, 26, 5, "#8d452a"], [15, 13, 34, 10, "#b65f36"], [13, 23, 38, 19, "#8d452a"],
      [16, 41, 7, 10, "#6d351f"], [41, 41, 7, 10, "#6d351f"],
      [20, 17, 24, 22, "#f0b889"], [17, 25, 3, 8, "#d7926c"], [44, 25, 3, 8, "#d7926c"],
      [23, 28, 4, 4, "#243044"], [37, 28, 4, 4, "#243044"], [30, 33, 4, 3, "#d7926c"], [27, 37, 10, 3, "#a6424f"],
      [24, 41, 16, 4, "#f0b889"], [16, 45, 32, 15, "#25a7a0"], [21, 45, 22, 5, "#ffe28a"],
      [26, 49, 12, 11, "#ffefc4"], [12, 50, 8, 10, "#25a7a0"], [44, 50, 8, 10, "#25a7a0"], [19, 60, 26, 2, "#263247"]
    ],
    "bald-beard": [
      [22, 10, 20, 5, "#f0be92"], [18, 15, 28, 22, "#f0be92"], [16, 23, 4, 9, "#d59a72"], [44, 23, 4, 9, "#d59a72"],
      [24, 26, 4, 4, "#1f2738"], [36, 26, 4, 4, "#1f2738"], [30, 31, 4, 3, "#c98461"],
      [22, 34, 20, 5, "#6a3b2b"], [20, 38, 24, 9, "#4a2b22"], [25, 42, 14, 4, "#6a3b2b"],
      [25, 47, 14, 4, "#f0be92"], [14, 49, 36, 11, "#5d6b3a"], [20, 49, 24, 5, "#9aa86b"],
      [25, 52, 14, 8, "#e8dfc5"], [11, 53, 8, 7, "#5d6b3a"], [45, 53, 8, 7, "#5d6b3a"], [18, 60, 28, 2, "#263247"]
    ],
    curly: [
      [18, 8, 6, 6, "#241b1c"], [24, 6, 7, 7, "#3a2b2d"], [32, 6, 7, 7, "#241b1c"], [40, 9, 6, 6, "#3a2b2d"],
      [14, 14, 36, 12, "#2e2225"], [18, 24, 28, 6, "#241b1c"], [20, 18, 24, 22, "#d99a73"],
      [16, 25, 4, 8, "#bd775a"], [44, 25, 4, 8, "#bd775a"], [23, 28, 4, 4, "#1f2738"], [37, 28, 4, 4, "#1f2738"],
      [30, 33, 4, 3, "#bd775a"], [27, 37, 10, 3, "#8e3d3d"], [24, 41, 16, 4, "#d99a73"],
      [16, 45, 32, 15, "#f28b3c"], [22, 45, 20, 5, "#ffd15c"], [12, 51, 8, 9, "#f28b3c"], [44, 51, 8, 9, "#f28b3c"], [18, 60, 28, 2, "#263247"]
    ],
    bob: [
      [17, 8, 30, 5, "#171f2c"], [13, 13, 38, 11, "#243044"], [12, 24, 40, 21, "#171f2c"],
      [16, 44, 8, 9, "#111827"], [40, 44, 8, 9, "#111827"], [20, 18, 24, 22, "#e6a77e"],
      [18, 25, 3, 8, "#c98461"], [43, 25, 3, 8, "#c98461"], [24, 28, 4, 4, "#243044"], [36, 28, 4, 4, "#243044"],
      [30, 33, 4, 3, "#c98461"], [27, 37, 10, 3, "#884155"], [24, 41, 16, 4, "#e6a77e"],
      [15, 45, 34, 15, "#7866d8"], [21, 45, 22, 4, "#dcd7ff"], [26, 49, 12, 11, "#f7eddc"],
      [11, 52, 8, 8, "#7866d8"], [45, 52, 8, 8, "#7866d8"], [18, 60, 28, 2, "#263247"]
    ],
    ponytail: [
      [20, 8, 24, 4, "#d7a135"], [16, 12, 32, 9, "#e5b64a"], [13, 20, 12, 17, "#b98027"], [39, 20, 12, 17, "#b98027"],
      [46, 20, 8, 18, "#d7a135"], [20, 17, 24, 22, "#efbd91"], [16, 25, 4, 8, "#d99a72"], [44, 25, 4, 8, "#d99a72"],
      [24, 28, 4, 4, "#263247"], [36, 28, 4, 4, "#263247"], [30, 33, 4, 3, "#d99a72"], [27, 37, 10, 3, "#a64155"],
      [24, 41, 16, 4, "#efbd91"], [16, 45, 32, 15, "#3f7fd9"], [21, 45, 22, 4, "#bfe8ff"],
      [26, 49, 12, 11, "#fff1c8"], [12, 51, 8, 9, "#3f7fd9"], [44, 51, 8, 9, "#3f7fd9"], [18, 60, 28, 2, "#263247"]
    ],
    cap: [
      [16, 8, 34, 5, "#e85b54"], [12, 13, 40, 8, "#e85b54"], [20, 10, 18, 3, "#fff2c6"], [44, 16, 10, 4, "#b83d38"],
      [18, 21, 28, 5, "#4a2c24"], [20, 20, 24, 20, "#d99a73"], [16, 26, 4, 7, "#bd775a"], [44, 26, 4, 7, "#bd775a"],
      [24, 28, 4, 4, "#1f2738"], [36, 28, 4, 4, "#1f2738"], [30, 33, 4, 3, "#bd775a"], [27, 37, 10, 3, "#884155"],
      [24, 41, 16, 4, "#d99a73"], [14, 45, 36, 15, "#2f6fe4"], [20, 45, 24, 5, "#8bd3ff"],
      [25, 49, 14, 11, "#fff5df"], [10, 52, 9, 8, "#2f6fe4"], [45, 52, 9, 8, "#2f6fe4"], [18, 60, 28, 2, "#263247"]
    ],
    silver: [
      [18, 8, 28, 5, "#cbd5e1"], [14, 13, 36, 9, "#94a3b8"], [18, 22, 28, 5, "#64748b"],
      [20, 18, 24, 22, "#e8b28a"], [16, 25, 4, 8, "#c98461"], [44, 25, 4, 8, "#c98461"],
      [22, 27, 8, 5, "#263247"], [34, 27, 8, 5, "#263247"], [30, 29, 4, 1, "#263247"],
      [24, 28, 4, 3, "#dce7f5"], [36, 28, 4, 3, "#dce7f5"], [30, 33, 4, 3, "#c98461"], [27, 37, 10, 3, "#7f3e52"],
      [24, 41, 16, 4, "#e8b28a"], [14, 45, 36, 15, "#713f8f"], [20, 45, 24, 5, "#ffd166"],
      [26, 49, 12, 11, "#f8efd6"], [10, 52, 9, 8, "#713f8f"], [45, 52, 9, 8, "#713f8f"], [18, 60, 28, 2, "#263247"]
    ]
  };

  const FOOD_PIXEL_SPRITES = {
    "generic-food": [
      [9, 8, 14, 3, "#6b4a2d"], [7, 11, 18, 10, "#f2d18a"], [9, 21, 14, 4, "#c58a48"],
      [11, 13, 4, 3, "#fff2b6"], [17, 15, 3, 2, "#a55e31"], [13, 19, 7, 2, "#fff2b6"]
    ],
    "generic-protein": [
      [7, 11, 18, 2, "#7c3b2d"], [6, 13, 20, 9, "#d9895b"], [8, 22, 16, 3, "#9b4c35"],
      [11, 15, 4, 2, "#ffd4a3"], [17, 17, 5, 2, "#ffd4a3"]
    ],
    "generic-carb": [
      [8, 10, 16, 3, "#7b5628"], [6, 13, 20, 12, "#e5bd66"], [9, 25, 14, 3, "#a87435"],
      [11, 16, 3, 2, "#fff0a8"], [17, 20, 5, 2, "#fff0a8"]
    ],
    "generic-fat": [
      [12, 6, 8, 3, "#6b4a2d"], [10, 9, 12, 16, "#d9b05f"], [11, 25, 10, 3, "#8a5f2b"],
      [13, 12, 6, 10, "#f8d77a"]
    ],
    salmon: [
      [8, 9, 15, 3, "#7b2d22"], [6, 12, 21, 11, "#f26a3d"], [8, 23, 16, 3, "#b43d2d"],
      [10, 13, 12, 2, "#ffd2a6"], [9, 17, 15, 2, "#ffe1bd"], [12, 21, 9, 2, "#ffb070"],
      [23, 13, 4, 8, "#ff9a54"]
    ],
    chicken: [
      [8, 10, 16, 3, "#9c5a3c"], [6, 13, 19, 9, "#f0b184"], [8, 22, 15, 4, "#c77752"],
      [11, 15, 4, 2, "#ffe1bd"], [17, 18, 4, 2, "#ffe1bd"], [22, 13, 4, 5, "#d08a61"]
    ],
    "air-fryer-chicken-leg-bone-skin": [
      [7, 10, 14, 12, "#c16d3d"], [10, 8, 11, 5, "#e29b61"], [18, 19, 5, 4, "#9c4f2b"],
      [20, 21, 7, 3, "#efe4ce"], [26, 20, 3, 5, "#efe4ce"], [11, 13, 4, 2, "#f1bd7a"]
    ],
    "air-fryer-chicken-wing-bone-skin": [
      [7, 12, 14, 7, "#c56d3d"], [13, 18, 12, 5, "#e1995a"], [21, 14, 5, 8, "#8f4828"],
      [6, 19, 5, 3, "#efe4ce"], [4, 18, 3, 5, "#efe4ce"], [10, 14, 4, 2, "#f4c184"]
    ],
    turkey: [
      [8, 11, 16, 3, "#8c5b3b"], [6, 14, 20, 8, "#e8b58a"], [9, 22, 14, 3, "#b47a54"],
      [11, 16, 12, 2, "#fff0cf"], [12, 19, 8, 2, "#fff0cf"]
    ],
    "natural-tuna-drained": [
      [9, 8, 14, 3, "#4b5b6b"], [7, 11, 18, 14, "#9bb5c7"], [9, 25, 14, 3, "#536b7c"],
      [10, 13, 12, 3, "#d8eef7"], [11, 18, 10, 4, "#7da0b5"], [22, 12, 3, 12, "#334453"]
    ],
    egg: [
      [12, 7, 8, 3, "#d4c9b8"], [9, 10, 14, 15, "#fff8e8"], [11, 25, 10, 3, "#d4c9b8"],
      [13, 15, 6, 6, "#f5bf35"], [14, 16, 4, 4, "#ffd95c"]
    ],
    "green-garlic": [
      [15, 4, 3, 21, "#3e8f45"], [18, 6, 3, 18, "#55b957"], [12, 8, 3, 17, "#62c66b"],
      [9, 5, 4, 3, "#7ad47d"], [8, 8, 5, 2, "#4ba24d"], [19, 4, 5, 3, "#8be087"],
      [21, 8, 4, 2, "#55b957"], [5, 14, 7, 3, "#6ecf73"], [21, 15, 6, 3, "#69c96e"],
      [10, 25, 13, 3, "#f4efe1"], [11, 28, 11, 2, "#d8cdb1"], [13, 26, 2, 2, "#ffffff"],
      [17, 26, 2, 2, "#ffffff"], [20, 26, 2, 2, "#ffffff"]
    ],
    gnocchi: [
      [8, 12, 5, 4, "#f6ddb2"], [15, 10, 5, 4, "#f9e6c5"], [21, 13, 5, 4, "#e9c99d"],
      [10, 18, 5, 4, "#e9c99d"], [17, 19, 5, 4, "#f6ddb2"], [23, 18, 4, 4, "#f9e6c5"],
      [7, 23, 19, 3, "#9c6a39"]
    ],
    potato: [
      [10, 9, 12, 2, "#8a5a2b"], [7, 11, 18, 4, "#b87936"], [6, 15, 20, 8, "#d39a4b"],
      [8, 23, 16, 4, "#b87936"], [11, 27, 10, 2, "#8a5a2b"], [10, 13, 3, 2, "#f2c270"],
      [18, 14, 2, 2, "#7a4d27"], [13, 18, 2, 2, "#8a5a2b"], [21, 20, 2, 2, "#f2c270"],
      [8, 18, 2, 2, "#7a4d27"], [15, 23, 3, 2, "#f5d084"]
    ],
    rice: [
      [8, 20, 16, 5, "#6f8fa8"], [6, 16, 20, 6, "#eff7fb"], [9, 13, 14, 5, "#ffffff"],
      [10, 11, 3, 2, "#d7e8ef"], [14, 10, 3, 2, "#d7e8ef"], [18, 11, 3, 2, "#d7e8ef"],
      [22, 13, 3, 2, "#d7e8ef"]
    ],
    pasta: [
      [7, 13, 18, 3, "#eac15f"], [6, 17, 20, 3, "#f0d176"], [8, 21, 17, 3, "#c99039"],
      [10, 11, 3, 11, "#f4d879"], [15, 12, 3, 11, "#f4d879"], [20, 12, 3, 10, "#f4d879"]
    ],
    bread: [
      [9, 9, 14, 4, "#8f5b2c"], [7, 13, 18, 11, "#d89d58"], [9, 24, 14, 3, "#a66a34"],
      [11, 15, 10, 6, "#f2c478"], [13, 17, 2, 2, "#fff1ba"], [18, 16, 2, 2, "#fff1ba"]
    ],
    oats: [
      [8, 20, 16, 5, "#7c9bb1"], [6, 15, 20, 7, "#f0ddb0"], [9, 12, 14, 5, "#e5c98d"],
      [11, 14, 3, 2, "#b58445"], [16, 13, 3, 2, "#b58445"], [21, 15, 2, 2, "#b58445"]
    ],
    "muesli-crunchy-zero": [
      [7, 20, 18, 5, "#8fa7ba"], [6, 15, 20, 7, "#f2d58a"], [9, 12, 5, 4, "#9b6a35"],
      [16, 11, 4, 4, "#cf8a32"], [21, 13, 4, 4, "#7f5a31"], [12, 17, 3, 2, "#fff3b0"]
    ],
    "oat-crunchy-rings": [
      [8, 12, 5, 5, "#d8a94f"], [16, 10, 5, 5, "#e6bf65"], [22, 15, 5, 5, "#c18d3d"],
      [10, 20, 5, 5, "#e6bf65"], [17, 21, 5, 5, "#d8a94f"], [9, 25, 16, 2, "#8a6a3e"]
    ],
    banana: [
      [8, 17, 3, 5, "#7a5a1f"], [10, 14, 5, 8, "#f4c63c"], [14, 12, 5, 10, "#ffe36c"],
      [19, 11, 5, 9, "#f4c63c"], [23, 10, 3, 5, "#7a5a1f"], [12, 21, 10, 3, "#d8a827"]
    ],
    blueberries: [
      [9, 12, 6, 6, "#4156b3"], [17, 10, 7, 7, "#5269d7"], [13, 18, 7, 7, "#31449b"],
      [21, 19, 5, 5, "#4156b3"], [11, 14, 2, 2, "#b9c7ff"], [19, 12, 2, 2, "#b9c7ff"]
    ],
    watermelon: [
      [6, 20, 21, 4, "#347a44"], [7, 16, 20, 4, "#8dd167"], [8, 10, 18, 8, "#f05a67"],
      [11, 13, 2, 2, "#2b1b22"], [17, 12, 2, 2, "#2b1b22"], [22, 15, 2, 2, "#2b1b22"]
    ],
    melon: [
      [8, 10, 17, 3, "#6a9d48"], [6, 13, 20, 10, "#bce177"], [8, 23, 16, 3, "#6a9d48"],
      [11, 15, 12, 5, "#f4efb8"], [13, 17, 2, 2, "#d5bf55"], [18, 16, 2, 2, "#d5bf55"]
    ],
    "greek-yogurt": [
      [10, 7, 12, 3, "#5c6f85"], [8, 10, 16, 15, "#dcefff"], [10, 25, 12, 3, "#8ba5bb"],
      [11, 13, 10, 8, "#ffffff"], [12, 12, 8, 2, "#b8d4e5"], [15, 16, 3, 2, "#e6f7ff"]
    ],
    lentils: [
      [7, 20, 18, 5, "#72503a"], [6, 15, 20, 7, "#b57645"], [9, 12, 4, 4, "#7b4e32"],
      [15, 13, 4, 4, "#6e452c"], [21, 12, 4, 4, "#8a5b38"], [11, 17, 12, 3, "#c58a53"]
    ],
    "cherry-tomato": [
      [14, 6, 4, 3, "#2f8d45"], [11, 8, 10, 3, "#45b85a"], [8, 11, 16, 3, "#c91f2e"],
      [6, 14, 20, 8, "#ef3f3f"], [8, 22, 16, 4, "#c91f2e"], [11, 26, 10, 2, "#8f1f2c"],
      [10, 13, 4, 3, "#ff7a65"], [15, 15, 2, 2, "#ffb0a0"], [20, 18, 3, 2, "#9f1f2e"],
      [9, 20, 3, 2, "#d82e38"], [17, 10, 3, 2, "#2f8d45"]
    ],
    "olive-oil": [
      [13, 5, 6, 3, "#566a3a"], [11, 8, 10, 4, "#6f8c43"], [10, 12, 12, 15, "#b7c84c"],
      [12, 15, 8, 9, "#f0d35b"], [11, 27, 10, 2, "#596f38"], [14, 9, 4, 2, "#e5f18b"]
    ],
    "peanut-butter": [
      [10, 7, 12, 3, "#5a3f2b"], [8, 10, 16, 15, "#c3823b"], [10, 25, 12, 3, "#6b4a2d"],
      [11, 13, 10, 7, "#e0a95c"], [13, 15, 6, 2, "#f5cc85"], [16, 21, 4, 2, "#8a572a"]
    ],
    avocado: [
      [10, 8, 12, 3, "#2f6e3f"], [7, 11, 18, 13, "#4da85a"], [9, 24, 14, 3, "#2f6e3f"],
      [11, 13, 10, 9, "#c9e77a"], [14, 16, 5, 5, "#8a5a2b"], [15, 17, 3, 3, "#5f3a21"]
    ],
    "fresh-cheese": [
      [8, 11, 18, 3, "#b8c9d6"], [7, 14, 20, 10, "#f5fbff"], [9, 24, 16, 3, "#b8c9d6"],
      [10, 16, 14, 2, "#dcebf4"], [12, 20, 4, 2, "#ffffff"], [18, 19, 4, 2, "#ffffff"]
    ],
    "whey-protein-scoop": [
      [10, 14, 14, 4, "#8b6dff"], [8, 18, 18, 7, "#c9bbff"], [11, 25, 12, 3, "#6d55d2"],
      [17, 10, 8, 3, "#6d55d2"], [23, 12, 3, 8, "#6d55d2"], [11, 20, 10, 2, "#efeaff"]
    ],
    "mahon-cheese": [
      [7, 12, 18, 3, "#a66b1f"], [6, 15, 20, 10, "#f0c04f"], [9, 25, 16, 3, "#b87a25"],
      [11, 17, 3, 3, "#ffe08a"], [17, 19, 2, 2, "#b87a25"], [22, 16, 2, 2, "#ffe08a"]
    ],
    "roquefort-cheese": [
      [7, 12, 18, 3, "#8a8f7a"], [6, 15, 20, 10, "#f3edce"], [9, 25, 16, 3, "#a4a890"],
      [11, 17, 4, 2, "#5e9b78"], [17, 20, 5, 2, "#5e9b78"], [21, 16, 3, 2, "#5e9b78"]
    ],
    "entrepinares-matured-mixed-cheese": [
      [8, 11, 16, 3, "#8e612a"], [6, 14, 20, 11, "#e8b84c"], [9, 25, 15, 3, "#9c6d2c"],
      [12, 16, 3, 3, "#ffe18a"], [18, 18, 3, 2, "#b67d2d"], [21, 21, 2, 2, "#ffe18a"]
    ]
  };

  const FOOD_PIXEL_ALIASES = {
    salmon: ["salmon"],
    chicken: ["pechuga", "pollo"],
    "air-fryer-chicken-leg-bone-skin": ["muslo", "cuarto trasero"],
    "air-fryer-chicken-wing-bone-skin": ["alita", "alitas"],
    turkey: ["pavo"],
    "natural-tuna-drained": ["atun", "tuna"],
    egg: ["huevo"],
    "green-garlic": ["green-garlic", "ajitos", "ajos tiernos", "ajetes", "ajo tierno"],
    gnocchi: ["gnocchi", "noquis"],
    potato: ["potato", "patata", "patatas", "papa"],
    rice: ["arroz"],
    pasta: ["pasta", "macarrones", "espaguetis"],
    bread: ["pan"],
    oats: ["avena"],
    "muesli-crunchy-zero": ["muesli"],
    "oat-crunchy-rings": ["crunchy rings", "rings"],
    banana: ["platano", "banana"],
    blueberries: ["arandanos"],
    watermelon: ["sandia"],
    melon: ["melon"],
    "greek-yogurt": ["kefir", "yogur", "yogurt"],
    lentils: ["lentejas"],
    "cherry-tomato": ["cherry-tomato", "tomate", "tomate cherry", "cherry"],
    "olive-oil": ["aceite", "oliva"],
    "peanut-butter": ["cacahuete", "mani"],
    avocado: ["aguacate", "avocado"],
    "fresh-cheese": ["queso fresco", "batido"],
    "whey-protein-scoop": ["whey", "proteina", "scoop"],
    "mahon-cheese": ["mahon"],
    "roquefort-cheese": ["roquefort"],
    "entrepinares-matured-mixed-cheese": ["entrepinares", "mezcla madurado", "queso mezcla"]
  };

  const FOOD_PAIRING_RULES = {
    salmon: ["cherry-tomato", "potato", "gnocchi", "bread", "green-garlic", "rice", "avocado", "olive-oil"],
    chicken: ["rice", "potato", "green-garlic", "cherry-tomato", "avocado", "olive-oil"],
    "air-fryer-chicken-leg-bone-skin": ["potato", "rice", "green-garlic", "cherry-tomato", "olive-oil", "avocado"],
    "air-fryer-chicken-wing-bone-skin": ["potato", "rice", "cherry-tomato", "green-garlic", "olive-oil", "avocado"],
    turkey: ["rice", "potato", "bread", "cherry-tomato", "avocado", "green-garlic"],
    "natural-tuna-drained": ["bread", "cherry-tomato", "avocado", "olive-oil", "pasta", "rice"],
    egg: ["bread", "avocado", "cherry-tomato", "green-garlic", "potato", "mahon-cheese"],
    "green-garlic": ["egg", "salmon", "chicken", "potato", "cherry-tomato", "olive-oil"],
    gnocchi: ["roquefort-cheese", "cherry-tomato", "olive-oil", "chicken", "mahon-cheese", "green-garlic"],
    potato: ["salmon", "chicken", "egg", "green-garlic", "cherry-tomato", "olive-oil"],
    rice: ["chicken", "turkey", "salmon", "lentils", "natural-tuna-drained", "avocado"],
    pasta: ["natural-tuna-drained", "cherry-tomato", "olive-oil", "roquefort-cheese", "chicken", "mahon-cheese"],
    bread: ["egg", "avocado", "natural-tuna-drained", "fresh-cheese", "peanut-butter", "mahon-cheese"],
    oats: ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "muesli-crunchy-zero"],
    "muesli-crunchy-zero": ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "oats"],
    "oat-crunchy-rings": ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "oats"],
    banana: ["greek-yogurt", "oats", "peanut-butter", "blueberries", "muesli-crunchy-zero", "whey-protein-scoop"],
    blueberries: ["greek-yogurt", "banana", "oats", "muesli-crunchy-zero", "whey-protein-scoop", "fresh-cheese"],
    watermelon: ["melon", "greek-yogurt", "fresh-cheese", "blueberries", "banana", "oats"],
    melon: ["watermelon", "greek-yogurt", "fresh-cheese", "blueberries", "banana", "oats"],
    "greek-yogurt": ["blueberries", "banana", "peanut-butter", "oats", "muesli-crunchy-zero", "oat-crunchy-rings"],
    lentils: ["rice", "cherry-tomato", "olive-oil", "green-garlic", "chicken", "potato"],
    "cherry-tomato": ["natural-tuna-drained", "avocado", "olive-oil", "egg", "salmon", "green-garlic"],
    "olive-oil": ["cherry-tomato", "green-garlic", "salmon", "natural-tuna-drained", "pasta", "avocado"],
    "peanut-butter": ["banana", "bread", "oats", "greek-yogurt", "blueberries", "muesli-crunchy-zero"],
    avocado: ["egg", "bread", "cherry-tomato", "natural-tuna-drained", "salmon", "olive-oil"],
    "fresh-cheese": ["blueberries", "banana", "bread", "oats", "muesli-crunchy-zero", "peanut-butter"],
    "whey-protein-scoop": ["greek-yogurt", "banana", "blueberries", "oats", "muesli-crunchy-zero", "peanut-butter"],
    "mahon-cheese": ["bread", "cherry-tomato", "egg", "pasta", "potato", "green-garlic"],
    "roquefort-cheese": ["gnocchi", "pasta", "bread", "cherry-tomato", "potato", "mahon-cheese"],
    "entrepinares-matured-mixed-cheese": ["bread", "cherry-tomato", "egg", "pasta", "potato", "green-garlic"]
  };

  const MEAT_FOOD_IDS = new Set([
    "chicken",
    "air-fryer-chicken-leg-bone-skin",
    "air-fryer-chicken-wing-bone-skin",
    "turkey"
  ]);
  const FISH_FOOD_IDS = new Set(["salmon", "natural-tuna-drained"]);

  function defaultDayContext() {
    return {
      training: "none",
      intensity: "normal",
      steps: ""
    };
  }

  function normalizeDayContext(context = {}) {
    const normalized = {
      ...defaultDayContext(),
      ...context
    };
    const validTraining = new Set([...Data.TRAINING_TYPES.map((item) => item.id), "mixed"]);
    const validIntensity = new Set(Data.INTENSITY_LEVELS.map((item) => item.id));

    if (!validTraining.has(normalized.training)) {
      normalized.training = "none";
    }
    if (!validIntensity.has(normalized.intensity) || normalized.training === "none") {
      normalized.intensity = "normal";
    }

    return normalized;
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentDay() {
    if (!state.days[state.selectedDate]) {
      state.days[state.selectedDate] = Storage.createDay(state.selectedDate, Data.DEFAULT_MEALS);
    }
    normalizeDay(state.days[state.selectedDate]);
    return state.days[state.selectedDate];
  }

  function normalizeDay(day) {
    day.context = normalizeDayContext(day.context);
    day.meals = Array.isArray(day.meals) ? day.meals : [];
    day.meals.forEach((meal) => {
      ensureMealItems(meal);
    });

    const mealsWithFoods = day.meals.filter((meal) => mealFoods(meal).length);
    if (mealsWithFoods.length) {
      day.meals = day.meals.filter((meal) => mealFoods(meal).length || meal.manuallyAdded);
      return;
    }

    day.meals = [
      day.meals[0] || createMeal("Comida 1"),
      ...day.meals.slice(1).filter((meal) => meal.manuallyAdded)
    ];
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function dayContextHasChanges(context) {
    const defaults = defaultDayContext();
    return (context.training || defaults.training) !== defaults.training
      || (context.intensity || defaults.intensity) !== defaults.intensity
      || String(context.steps ?? defaults.steps) !== defaults.steps;
  }

  function dayHasContent(day) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    const context = normalizeDayContext(day.context);
    return meals.some((meal) => mealFoods(meal).length || meal.manuallyAdded)
      || dayContextHasChanges(context)
      || String(day.note || "").trim().length > 0;
  }

  function dayHasLoggedFood(day) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    return meals.some((meal) => mealFoods(meal).length);
  }

  function dayCanBeReplaced(date) {
    const day = state.days[date];
    return !day || (!day.savedAt && !dayHasContent(day));
  }

  function nextCleanDateAfter(date) {
    let candidate = Storage.addDaysIso(date, 1);
    let guard = 0;

    while (!dayCanBeReplaced(candidate) && guard < 370) {
      candidate = Storage.addDaysIso(candidate, 1);
      guard += 1;
    }

    return candidate;
  }

  function previousDaySuggestion(day) {
    const sourceDate = day.date || state.selectedDate;
    if (sourceDate !== Storage.todayIso() || !dayHasContent(day)) return null;

    const previousDate = Storage.addDaysIso(sourceDate, -1);
    if (!dayCanBeReplaced(previousDate)) return null;

    return {
      previousDate,
      registered: Boolean(day.savedAt)
    };
  }

  function latestPendingDateBefore(date) {
    return Object.entries(state.days || {})
      .map(([key, day]) => {
        if (!day) return null;
        return {
          date: day.date || key,
          day
        };
      })
      .filter((item) => item
        && isIsoDate(item.date)
        && item.date < date
        && !item.day.savedAt
        && dayHasContent(item.day))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => item.date)[0] || "";
  }

  function initializeSelectedDate() {
    const activeDate = Storage.activeDayIso();
    const selectedDate = isIsoDate(state.selectedDate) ? state.selectedDate : "";
    const selectedDay = selectedDate ? state.days[selectedDate] : null;

    if (selectedDay) {
      selectedDay.date = selectedDay.date || selectedDate;
      normalizeDay(selectedDay);
    }

    if (selectedDay && !selectedDay.savedAt && dayHasContent(selectedDay)) {
      state.selectedDate = selectedDate;
      currentDay();
      return;
    }

    const pendingDate = latestPendingDateBefore(activeDate);
    if (pendingDate) {
      state.selectedDate = pendingDate;
      currentDay();
      return;
    }

    if (!selectedDate
      || !selectedDay
      || selectedDay.savedAt
      || (selectedDate < activeDate && !dayHasContent(selectedDay))) {
      state.selectedDate = activeDate;
    } else {
      state.selectedDate = selectedDate;
    }

    currentDay();
  }

  function createMeal(name, manuallyAdded = false) {
    return {
      id: Storage.uid("meal"),
      name,
      items: [],
      manuallyAdded
    };
  }

  function mealFoods(meal) {
    return Array.isArray(meal.foods)
      ? meal.foods
      : Array.isArray(meal.items) ? meal.items : [];
  }

  function ensureMealItems(meal) {
    meal.items = Array.isArray(meal.foods)
      ? meal.foods
      : Array.isArray(meal.items) ? meal.items : [];
    return meal.items;
  }

  function setMealFoods(meal, foods) {
    meal.items = foods;
    if (Array.isArray(meal.foods)) meal.foods = foods;
  }

  function mealTemplateItemsFromMeal(meal) {
    return mealFoods(meal)
      .map((item) => ({
        foodId: item.foodId,
        grams: Nutrition.number(item.grams)
      }))
      .filter((item) => item.foodId && item.grams > 0);
  }

  function mealTemplateSignature(items) {
    return items
      .map((item) => `${item.foodId}:${Nutrition.round(item.grams, 1)}`)
      .sort()
      .join("|");
  }

  function findMealTemplateBySignature(items) {
    const signature = mealTemplateSignature(items);
    if (!signature) return null;
    return (state.mealTemplates || []).find((template) => mealTemplateSignature(template.items || []) === signature);
  }

  function mealTemplateTotal(template) {
    if (Array.isArray(template.itemSnapshots) && template.itemSnapshots.length) {
      return template.itemSnapshots.reduce((total, snapshot) => {
        addTotals(total, snapshot.macros || Nutrition.foodMacros(snapshot.per100 || {}, snapshot.grams));
        return total;
      }, Nutrition.zeroMacros());
    }

    const aggregate = Nutrition.aggregateDay({ meals: [{ ...template, items: template.items || [] }] }, state.foods);
    return aggregate.meals[0]?.total || Nutrition.zeroMacros();
  }

  function cloneTemplateItems(template) {
    return (template.items || []).map((item, index) => {
      const food = Nutrition.findFoodById(state.foods, item.foodId);
      const snapshot = (template.itemSnapshots || [])[index];
      const clonedItem = {
        id: Storage.uid("item"),
        foodId: item.foodId,
        grams: Nutrition.number(item.grams)
      };

      if (!food && snapshot) {
        clonedItem.foodSnapshot = templateFoodSnapshot(snapshot);
      }

      return clonedItem;
    });
  }

  function templateFoodSnapshot(snapshot) {
    if (!snapshot) return null;

    return {
      foodId: snapshot.foodId,
      name: snapshot.foodNameSnapshot || "Alimento guardado",
      per100: cloneMacros(snapshot.per100 || {})
    };
  }

  function cloneExistingFoodSnapshot(snapshot, fallbackFoodId = "") {
    if (!snapshot) return null;
    const per100 = snapshot.per100 || snapshot.macrosPer100 || {};

    return {
      foodId: snapshot.foodId || fallbackFoodId,
      name: snapshot.name || snapshot.foodName || snapshot.foodNameSnapshot || "Alimento guardado",
      per100: cloneMacros(per100)
    };
  }

  function historySnapshotForItem(snapshotMeal, item) {
    const snapshots = snapshotMeal?.items || [];
    return snapshots.find((snapshot) => snapshot.id === item.id)
      || snapshots.find((snapshot) => snapshot.foodId === item.foodId
        && Nutrition.round(snapshot.grams, 1) === Nutrition.round(item.grams, 1));
  }

  function foodSnapshotFromHistoryItem(snapshotItem, item) {
    const grams = Math.max(Nutrition.number(snapshotItem?.grams, item?.grams), 0);
    const macros = snapshotItem?.macros || {};
    const per100 = Nutrition.MACRO_META.reduce((acc, meta) => {
      acc[meta.key] = grams > 0
        ? Nutrition.round((Nutrition.number(macros[meta.key]) * 100) / grams, meta.precision + 1)
        : 0;
      return acc;
    }, {});

    return {
      foodId: snapshotItem?.foodId || item?.foodId || "",
      name: snapshotItem?.foodName || snapshotItem?.foodNameSnapshot || "Alimento guardado",
      per100
    };
  }

  function cloneHistoryItem(item, snapshotMeal) {
    const grams = Nutrition.number(item.grams);
    if (!item.foodId || grams <= 0) return null;

    const clonedItem = {
      id: Storage.uid("item"),
      foodId: item.foodId,
      grams
    };

    if (!Nutrition.findFoodById(state.foods, item.foodId)) {
      const snapshotItem = historySnapshotForItem(snapshotMeal, item);
      clonedItem.foodSnapshot = cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
        || foodSnapshotFromHistoryItem(snapshotItem, item);
    }

    return clonedItem;
  }

  function cloneSavedDayMealsForActiveDay(sourceDay) {
    const snapshotMeals = sourceDay.nutritionSnapshot?.meals || [];
    const liveMeals = (sourceDay.meals || [])
      .map((meal) => ({
        name: meal.name || "Comida repetida",
        items: mealFoods(meal),
        snapshotMeal: snapshotMeals.find((snapshotMeal) => snapshotMeal.id === meal.id)
      }))
      .filter((meal) => meal.items.length);

    const sourceMeals = liveMeals.length
      ? liveMeals
      : snapshotMeals
        .map((meal) => ({
          name: meal.name || "Comida repetida",
          items: meal.items || [],
          snapshotMeal: meal
        }))
        .filter((meal) => meal.items.length);

    let fallbackCount = 0;
    const meals = sourceMeals.map((meal) => {
      const items = meal.items
        .map((item) => cloneHistoryItem(item, meal.snapshotMeal))
        .filter(Boolean);

      fallbackCount += items.filter((item) => item.foodSnapshot).length;

      return {
        id: Storage.uid("meal"),
        name: meal.name,
        items,
        manuallyAdded: true
      };
    }).filter((meal) => meal.items.length);

    return { meals, fallbackCount };
  }

  function recoveryItemFromDayItem(item, snapshotMeal) {
    const grams = Nutrition.number(item.grams);
    if (!item.foodId || grams <= 0) return null;

    const food = Nutrition.findFoodById(state.foods, item.foodId);
    const snapshotItem = historySnapshotForItem(snapshotMeal, item);
    const foodSnapshot = food
      ? {
        foodId: item.foodId,
        name: food.name,
        per100: cloneMacros(food)
      }
      : cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
        || foodSnapshotFromHistoryItem(snapshotItem, item);

    return {
      foodId: item.foodId,
      grams,
      ...(foodSnapshot ? { foodSnapshot } : {})
    };
  }

  function buildLastClosedDayRecovery(day) {
    const snapshotMeals = day.nutritionSnapshot?.meals || [];
    const meals = (day.meals || [])
      .map((meal) => {
        const snapshotMeal = snapshotMeals.find((item) => item.id === meal.id);
        const items = mealFoods(meal)
          .map((item) => recoveryItemFromDayItem(item, snapshotMeal))
          .filter(Boolean);
        return {
          name: meal.name || "Comida recuperada",
          items
        };
      })
      .filter((meal) => meal.items.length);

    if (!meals.length) return null;

    return {
      sourceDate: day.date,
      savedAt: day.savedAt,
      createdAt: new Date().toISOString(),
      meals
    };
  }

  function cloneRecoveryMeals(recovery) {
    const recoveryMeals = Array.isArray(recovery?.meals) ? recovery.meals : [];
    return recoveryMeals.map((meal) => {
      const items = (meal.items || [])
        .map((item) => {
          const grams = Nutrition.number(item.grams);
          if (!item.foodId || grams <= 0) return null;
          return {
            id: Storage.uid("item"),
            foodId: item.foodId,
            grams,
            ...(item.foodSnapshot ? {
              foodSnapshot: cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
            } : {})
          };
        })
        .filter(Boolean);

      return {
        id: Storage.uid("meal"),
        name: meal.name || "Comida recuperada",
        items,
        manuallyAdded: true
      };
    }).filter((meal) => meal.items.length);
  }

  function hasRecoverableClosedDay() {
    return Boolean(state.lastClosedDayRecovery?.meals?.length);
  }

  function cloneMacros(macros) {
    const source = macros || {};
    return Nutrition.MACRO_META.reduce((acc, meta) => {
      acc[meta.key] = Nutrition.round(source[meta.key], meta.precision + 1);
      return acc;
    }, {});
  }

  function buildNutritionSnapshot(day) {
    const summary = Nutrition.summarizeDay(day, state.profile, state.foods);
    const createdAt = new Date().toISOString();

    return {
      version: 1,
      createdAt,
      total: cloneMacros(summary.total),
      targets: cloneMacros(summary.targets),
      kcalRange: {
        min: Nutrition.round(summary.kcalRange.min),
        max: Nutrition.round(summary.kcalRange.max)
      },
      meals: summary.aggregate.meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        total: cloneMacros(meal.total),
        items: mealFoods(meal).map((item) => {
          const food = Nutrition.findFoodById(state.foods, item.foodId);
          const itemMacros = food ? Nutrition.foodMacros(food, item.grams) : Nutrition.zeroMacros();
          return {
            id: item.id,
            foodId: item.foodId,
            foodName: food ? food.name : "Alimento no encontrado",
            grams: Nutrition.number(item.grams),
            macros: cloneMacros(itemMacros)
          };
        })
      }))
    };
  }

  function buildMealTemplateSnapshots(items) {
    return items.map((item) => {
      const food = Nutrition.findFoodById(state.foods, item.foodId);
      const per100 = food ? cloneMacros(food) : Nutrition.zeroMacros();
      const macros = food ? cloneMacros(Nutrition.foodMacros(food, item.grams)) : Nutrition.zeroMacros();

      return {
        foodId: item.foodId,
        foodNameSnapshot: food ? food.name : "Alimento guardado",
        grams: Nutrition.number(item.grams),
        per100,
        macros
      };
    });
  }

  function dayTotalForHistory(day) {
    return day.nutritionSnapshot?.total || Nutrition.aggregateDay(day, state.foods).total;
  }

  function persist() {
    Storage.save(state);
  }

  function saveAndRender(message) {
    persist();
    render();
    if (message) showToast(message);
  }

  function hideToast() {
    window.clearTimeout(showToast.timer);
    refs.toast.classList.remove("is-visible", "has-action");
    refs.toast.innerHTML = "";
  }

  function showToast(message, options = {}) {
    const hasAction = Boolean(options.actionLabel && options.onAction);
    if (!hasAction) uiState.pendingUndo = null;

    refs.toast.innerHTML = "";
    refs.toast.classList.toggle("has-action", hasAction);

    const copy = document.createElement("span");
    copy.textContent = message;
    refs.toast.appendChild(copy);

    if (hasAction) {
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = options.actionLabel;
      action.addEventListener("click", options.onAction);
      refs.toast.appendChild(action);
    }

    refs.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    const duration = Number.isFinite(options.duration) ? options.duration : 2400;
    showToast.timer = window.setTimeout(() => {
      hideToast();
      if (options.onExpire) options.onExpire();
    }, duration);
  }

  function clearPendingUndo(options = {}) {
    uiState.pendingUndo = null;
    if (options.hideToast) hideToast();
  }

  function itemIdExists(day, itemId) {
    return (day.meals || []).some((meal) => mealFoods(meal).some((item) => item.id === itemId));
  }

  function restoreItemClone(item, day) {
    const clone = cloneValue(item);
    if (itemIdExists(day, clone.id)) clone.id = Storage.uid("item");
    return clone;
  }

  function restoreMealClone(meal, day) {
    const clone = cloneValue(meal);
    if ((day.meals || []).some((item) => item.id === clone.id)) clone.id = Storage.uid("meal");
    const items = mealFoods(clone).map((item) => restoreItemClone(item, day));
    clone.items = items;
    delete clone.foods;
    return clone;
  }

  function setPendingUndo(undo, message) {
    uiState.pendingUndo = undo;
    showToast(message, {
      actionLabel: "Deshacer",
      duration: 8000,
      onAction: () => runPendingUndo(undo.id),
      onExpire: () => {
        if (uiState.pendingUndo?.id === undo.id) uiState.pendingUndo = null;
      }
    });
  }

  function runPendingUndo(undoId) {
    const undo = uiState.pendingUndo;
    const failureMessage = undo?.failureMessage || "No se pudo deshacer esa acción.";
    if (!undo || undo.id !== undoId || undo.date !== state.selectedDate || currentDay().savedAt) {
      clearPendingUndo();
      showToast(failureMessage);
      return;
    }

    const restored = undo.type === "remove-item"
      ? restoreRemovedItem(undo)
      : undo.type === "remove-meal"
        ? restoreRemovedMeal(undo)
        : undo.type === "clear-meal"
          ? restoreClearedMeal(undo)
          : undo.type === "diagnostic-add-item" ? removeAddedItem(undo) : false;

    clearPendingUndo();
    saveAndRender(restored
      ? undo.successMessage || "Acción deshecha."
      : failureMessage);
  }

  function restoreRemovedItem(undo) {
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!meal) return false;

    const items = ensureMealItems(meal);
    const item = restoreItemClone(undo.payload.item, day);
    const index = Math.max(0, Math.min(undo.payload.itemIndex, items.length));
    items.splice(index, 0, item);
    setMealFoods(meal, items);
    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  function restoreRemovedMeal(undo) {
    const day = currentDay();
    const meal = restoreMealClone(undo.payload.meal, day);
    const index = Math.max(0, Math.min(undo.payload.mealIndex, day.meals.length));
    day.meals.splice(index, 0, meal);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.addFoodMealIds.delete(meal.id);
    return true;
  }

  function restoreClearedMeal(undo) {
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!meal) return false;

    const currentItems = mealFoods(meal);
    const restoredItems = (undo.payload.items || []).map((item) => restoreItemClone(item, day));
    const restoredIds = new Set(restoredItems.map((item) => item.id));
    setMealFoods(meal, [
      ...restoredItems,
      ...currentItems.filter((item) => !restoredIds.has(item.id))
    ]);
    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  function removeAddedItem(undo) {
    const day = currentDay();
    const result = DiagnosisActions.removeItemFromMeal(day, undo.payload.mealId, undo.payload.itemId, {
      removeCreatedMeal: undo.payload.createdMeal
    });
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!result.removed) return false;
    if (!meal) return true;

    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  function confirmDanger(message) {
    return window.confirm(message);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function foodSpriteKey(food) {
    const id = typeof food === "object" && food ? food.id : "";
    const name = typeof food === "object" && food ? food.name : food;
    if (id && FOOD_PIXEL_SPRITES[id]) return id;

    const normalizedId = Nutrition.normalize(id || "");
    const normalizedName = Nutrition.normalize(name || "");
    return Object.entries(FOOD_PIXEL_ALIASES).find(([, aliases]) => {
      return aliases.some((alias) => {
        const normalizedAlias = Nutrition.normalize(alias);
        return normalizedId === normalizedAlias || normalizedName.includes(normalizedAlias);
      });
    })?.[0] || fallbackFoodSpriteKey(food);
  }

  function fallbackFoodSpriteKey(food) {
    if (typeof food !== "object" || !food) return "generic-food";

    const protein = Number(food.protein || 0);
    const carbs = Number(food.carbs || 0);
    const fat = Number(food.fat || 0);

    if (fat >= protein && fat >= carbs && fat > 8) return "generic-fat";
    if (protein >= carbs && protein >= fat && protein > 8) return "generic-protein";
    if (carbs >= protein && carbs >= fat && carbs > 10) return "generic-carb";
    return "generic-food";
  }

  function renderFoodSprite(food) {
    const key = foodSpriteKey(food);
    const rects = FOOD_PIXEL_SPRITES[key];
    if (!rects) return "";

    return `
      <span class="food-sprite food-sprite-${escapeHtml(key)}" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="32" height="32" role="img" focusable="false">
          ${rects.map(([x, y, width, height, fill]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"></rect>`).join("")}
        </svg>
      </span>
    `;
  }

  function profileAvatarId(profile) {
    const avatarId = String(profile?.avatarId || "");
    if (PROFILE_PIXEL_SPRITES[avatarId]) return avatarId;
    return profile?.sex === "female" ? "female" : "male";
  }

  function profileAvatarLabel(avatarId) {
    return (PROFILE_PIXEL_AVATARS.find((avatar) => avatar.id === avatarId) || PROFILE_PIXEL_AVATARS[0]).label;
  }

  function renderProfileSprite(avatarId) {
    const key = PROFILE_PIXEL_SPRITES[avatarId] ? avatarId : "male";
    const rects = PROFILE_PIXEL_SPRITES[key];

    return `
      <svg class="profile-pixel-sprite profile-pixel-sprite-${key}" viewBox="0 0 64 64" width="64" height="64" role="img" focusable="false">
        ${rects.map(([x, y, width, height, fill]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"></rect>`).join("")}
      </svg>
    `;
  }

  function renderAvatarPicker(currentAvatarId) {
    return `
      <fieldset class="avatar-picker">
        <legend>Avatar</legend>
        <div class="avatar-options">
          ${PROFILE_PIXEL_AVATARS.map((avatar) => `
            <label class="avatar-option ${avatar.id === currentAvatarId ? "is-selected" : ""}">
              <input type="radio" name="avatarId" value="${escapeHtml(avatar.id)}" ${avatar.id === currentAvatarId ? "checked" : ""}>
              <span class="avatar-preview" aria-hidden="true">${renderProfileSprite(avatar.id)}</span>
              <span>${escapeHtml(avatar.label)}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function selected(value, target) {
    return value === target ? "selected" : "";
  }

  function hasTrainingType(value, type) {
    return value === type || value === "mixed";
  }

  function trainingValueFromFlags(hasStrength, hasCardio) {
    if (hasStrength && hasCardio) return "mixed";
    if (hasStrength) return "strength";
    if (hasCardio) return "cardio";
    return "none";
  }

  function nextTrainingSelection(currentValue, selectedValue) {
    if (selectedValue === "none") return "none";

    const current = currentValue || "none";
    const hasStrength = hasTrainingType(current, "strength");
    const hasCardio = hasTrainingType(current, "cardio");
    const nextStrength = selectedValue === "strength" ? !hasStrength : hasStrength;
    const nextCardio = selectedValue === "cardio" ? !hasCardio : hasCardio;
    return trainingValueFromFlags(nextStrength, nextCardio);
  }

  function isDayContextOptionActive(name, value, optionId) {
    if (name !== "training") return value === optionId;
    if (optionId === "none") return !value || value === "none";
    return hasTrainingType(value, optionId);
  }

  function renderDayContextChoiceButtons(name, options, value, disabled = false) {
    return options.map((item) => {
      const isActive = isDayContextOptionActive(name, value, item.id);
      return `
        <button
          class="day-context-choice ${isActive ? "is-active" : ""}"
          type="button"
          data-action="set-day-context"
          data-field="${escapeHtml(name)}"
          data-value="${escapeHtml(item.id)}"
          aria-pressed="${isActive ? "true" : "false"}"
          ${disabled ? "disabled" : ""}
        >${escapeHtml(item.label)}</button>
      `;
    }).join("");
  }

  function renderDayTrainingCard(context) {
    const intensityDisabled = context.training === "none";
    return `
      <div class="field context-choice-field day-training-card">
        <span>Entreno de hoy</span>
        <div class="day-training-card-grid">
          <div class="context-choice-block">
            <small>Tipo</small>
            <div class="context-choice-group" role="group" aria-label="Tipo de entreno">
              ${renderDayContextChoiceButtons("training", Data.TRAINING_TYPES, context.training)}
            </div>
          </div>
          <div class="context-choice-block ${intensityDisabled ? "is-disabled" : ""}">
            <small>Intensidad</small>
            <div class="context-choice-group" role="group" aria-label="Intensidad" ${intensityDisabled ? 'aria-disabled="true"' : ""}>
              ${renderDayContextChoiceButtons("intensity", Data.INTENSITY_LEVELS, context.intensity, intensityDisabled)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function optionLabel(options, value) {
    return (options.find((item) => item.id === value) || options[0]).label;
  }

  function formatWithUnit(value, meta) {
    return `${formatMacro(value, meta.precision)} ${meta.unit}`;
  }

  function formatDate(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "fecha desconocida";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function dayStatusLabel(day) {
    const activeDate = Storage.activeDayIso();
    if (day.savedAt) return `Histórico registrado - ${formatDate(day.date)}`;
    if (day.date === activeDate) return `Día activo - ${formatDate(day.date)}`;
    if (day.date < activeDate) return `Pendiente anterior - ${formatDate(day.date)}`;
    return `Siguiente día - ${formatDate(day.date)}`;
  }

  function formatMacro(value, precision = 0) {
    return Nutrition.formatNumber(value, precision);
  }

  function icon(name) {
    return Icons.icon(name);
  }

  function getRenderContext() {
    const day = currentDay();
    const summary = Nutrition.summarizeDay(day, state.profile, state.foods);
    if (day.savedAt && day.nutritionSnapshot) {
      summary.total = day.nutritionSnapshot.total;
      summary.targets = day.nutritionSnapshot.targets || summary.targets;
      Object.assign(summary, Nutrition.buildSummaryInsights(summary.total, summary.targets, state.foods));
      if (day.nutritionSnapshot.kcalRange) summary.kcalRange = day.nutritionSnapshot.kcalRange;
      summary.aggregate.total = day.nutritionSnapshot.total;
      summary.aggregate.meals = summary.aggregate.meals.map((meal) => {
        const snapshotMeal = (day.nutritionSnapshot.meals || []).find((item) => item.id === meal.id);
        return snapshotMeal ? { ...meal, total: snapshotMeal.total } : meal;
      });
      summary.meals = summary.aggregate.meals;
    }

    return {
      day,
      profile: state.profile,
      foods: state.foods,
      activeFoods: activeFoods(),
      summary
    };
  }

  function render() {
    const isFoodView = uiState.view === "foods";
    const isProfileView = uiState.view === "profile";
    const context = getRenderContext();
    const isSavedHistory = Boolean(context.day.savedAt);
    const quickSearchWrap = refs.quickSearch.closest(".quick-search");
    const topbarIcon = isProfileView
      ? "profile"
      : isFoodView
      ? "foods"
      : ["goals", "history"].includes(uiState.activeNav)
      ? uiState.activeNav
      : "diary";
    document.body.classList.toggle("is-profile-view", isProfileView);
    document.body.dataset.topbarIcon = topbarIcon;
    refs.date.value = state.selectedDate;
    renderProfile();
    renderNavigation();
    renderQuickFoodList();
    renderSummary(context);
    renderEquivalences(context);
    renderAnalysis(context);
    refs.dayEyebrow.textContent = isProfileView ? "Perfil" : isFoodView ? "Biblioteca" : dayStatusLabel(context.day);
    refs.dayTitle.textContent = isProfileView ? "Editar perfil" : isFoodView ? "Gestionar alimentos" : "DIARIO DE COMIDAS";
    refs.dayContext.hidden = isFoodView || isProfileView;
    refs.macroCards.hidden = isFoodView || isProfileView;
    refs.mealWorkbench.hidden = isFoodView || isProfileView;
    refs.meals.hidden = isFoodView || isProfileView;
    refs.historyPanel.hidden = isFoodView || isProfileView;
    refs.dayInsights.hidden = isFoodView || isProfileView;
    refs.profileEditor.hidden = !isProfileView;
    refs.libraryPanel.hidden = !isFoodView;
    refs.summaryPanel.hidden = isProfileView;
    refs.saveDay.hidden = isFoodView || isProfileView || isSavedHistory;
    refs.quickSearch.disabled = isFoodView || isProfileView || isSavedHistory;
    if (quickSearchWrap) quickSearchWrap.hidden = isFoodView || isProfileView || isSavedHistory;
    if (refs.dateActions) refs.dateActions.hidden = isProfileView;

    if (isProfileView) {
      renderProfileEditor();
      return;
    }

    if (isFoodView) {
      renderFoodManager();
      return;
    }

    renderDayContext(context);
    renderMacroCards(context);
    renderMeals(context);
    renderHistory();
  }

  function renderNavigation() {
    const activeNav = uiState.view === "profile"
      ? ""
      : uiState.view === "foods"
      ? "foods"
      : uiState.activeNav === "foods" ? "diary" : uiState.activeNav;

    refs.sideNav.querySelectorAll("button[data-nav]").forEach((button) => {
      const isActive = button.dataset.nav === activeNav;
      button.classList.toggle("is-active", isActive);
    });
  }

  function renderQuickFoodList() {
    refs.quickFoodList.innerHTML = sortFoods(activeFoods())
      .map((food) => `<option value="${escapeHtml(food.name)}"></option>`)
      .join("");
  }

  function renderProfile() {
    const profile = state.profile;
    const goal = optionLabel(Data.GOALS, profile.goal);
    const activity = optionLabel(Data.ACTIVITY_LEVELS, profile.activity);
    const profileName = String(profile.profileName || "").trim() || "Mi perfil";
    const avatarId = profileAvatarId(profile);
    refs.profileTitle.textContent = profileName;
    refs.profilePanelContent.innerHTML = `
      <div class="profile-summary">
        <div class="profile-identity">
          <span class="profile-avatar profile-avatar-${escapeHtml(avatarId)}" aria-hidden="true">${renderProfileSprite(avatarId)}</span>
          <div>
            <strong>${escapeHtml(profileName)}</strong>
            <span>${profile.sex === "female" ? "Mujer" : "Hombre"} · ${escapeHtml(profile.age)} años · ${escapeHtml(profileAvatarLabel(avatarId))}</span>
          </div>
        </div>
        <div class="profile-quick-stats">
          <span><strong>${escapeHtml(profile.weight)} kg</strong>Peso</span>
          <span><strong>${escapeHtml(profile.height)} cm</strong>Altura</span>
          <span><strong>${escapeHtml(profile.trainingDays)}/sem</strong>Entreno</span>
        </div>
        <p class="profile-context">${escapeHtml(goal)} · ${escapeHtml(activity)} · ${escapeHtml(profile.steps)} pasos</p>
      </div>
      <div class="profile-actions">
        <button class="quiet-action" type="button" data-action="edit-profile">${uiState.view === "profile" ? "Editando perfil" : "Editar perfil"}</button>
      </div>
    `;
  }

  function renderProfileEditor() {
    const profile = state.profile;
    const profileName = String(profile.profileName || "").trim() || "Mi perfil";
    const avatarId = profileAvatarId(profile);

    refs.profileEditor.innerHTML = `
      <div class="profile-editor-card">
        <div class="profile-editor-head">
          <span class="profile-avatar profile-avatar-${escapeHtml(avatarId)}" aria-hidden="true">${renderProfileSprite(avatarId)}</span>
          <div>
            <p>Perfil</p>
            <h2 id="profile-editor-title">Editar perfil</h2>
            <span>Los cambios se aplican solo al guardar.</span>
          </div>
        </div>
        <form class="profile-editor-form" data-action="profile-editor" novalidate>
          <div class="form-grid">
            <label class="field full">
              <span>Nombre</span>
              <input name="profileName" type="text" maxlength="40" value="${escapeHtml(profileName)}">
            </label>
            <label class="field">
              <span>Sexo</span>
              <select name="sex">
                <option value="male" ${selected(profile.sex, "male")}>Hombre</option>
                <option value="female" ${selected(profile.sex, "female")}>Mujer</option>
              </select>
            </label>
            <label class="field">
              <span>Edad</span>
              <input name="age" type="number" min="12" max="100" value="${escapeHtml(profile.age)}">
            </label>
            ${renderAvatarPicker(avatarId)}
            <label class="field">
              <span>Altura</span>
              <input name="height" type="number" min="120" max="230" value="${escapeHtml(profile.height)}">
            </label>
            <label class="field">
              <span>Peso</span>
              <input name="weight" type="number" min="35" max="220" step="0.1" value="${escapeHtml(profile.weight)}">
            </label>
            <label class="field full">
              <span>Actividad</span>
              <select name="activity">
                ${Data.ACTIVITY_LEVELS.map((level) => `
                  <option value="${level.id}" ${selected(profile.activity, level.id)}>${escapeHtml(level.label)}</option>
                `).join("")}
              </select>
            </label>
            <label class="field full">
              <span>Objetivo</span>
              <select name="goal">
                ${Data.GOALS.map((goalOption) => `
                  <option value="${goalOption.id}" ${selected(profile.goal, goalOption.id)}>${escapeHtml(goalOption.label)}</option>
                `).join("")}
              </select>
            </label>
            <label class="field">
              <span>Entrenos/sem</span>
              <input name="trainingDays" type="number" min="0" max="14" value="${escapeHtml(profile.trainingDays)}">
            </label>
            <label class="field">
              <span>Pasos/dia</span>
              <input name="steps" type="number" min="0" max="40000" step="500" value="${escapeHtml(profile.steps)}">
            </label>
          </div>
          <div class="profile-editor-actions">
            <button class="secondary-action profile-discard-action" type="button" data-action="discard-profile">Descartar cambios</button>
            <button class="primary-action profile-save-action" type="submit">Guardar perfil</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderDayContext(renderContext) {
    const { day, summary } = renderContext;
    const context = day.context;
    const totals = summary.total;
    const targets = summary.targets;
    const kcalRange = summary.kcalRange;
    const energy = summary.energy;
    const toneClass = dayToneClass(totals, kcalRange);
    const energyScaleMax = Math.max(kcalRange.max * 1.12, targets.maintenance, totals.kcal, targets.kcal, 1);
    const toEnergyPct = (value) => Math.min(100, Math.max(0, (value / energyScaleMax) * 100));
    const pct = toEnergyPct(totals.kcal);
    const rangeStartPct = toEnergyPct(kcalRange.min);
    const rangeEndPct = toEnergyPct(kcalRange.max);
    const rangeWidthPct = Math.min(100 - rangeStartPct, Math.max(1.5, rangeEndPct - rangeStartPct));
    const overWidthPct = Math.max(0, 100 - rangeEndPct);
    const energyScaleLabel = `${formatMacro(totals.kcal)} kcal registradas. Objetivo ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal. Gasto ${formatMacro(targets.maintenance)} kcal.`;
    const isSavedHistory = Boolean(day.savedAt);

    refs.dayContext.innerHTML = `
      <section class="day-editor ${toneClass}" aria-labelledby="day-context-title">
        ${renderHistoricalDayBanner(day)}
        <div class="day-hero-main">
          <div class="day-status-copy">
            <h2 id="day-context-title">${escapeHtml(energy.headline)}</h2>
            <strong class="day-energy-metric">${energy.metric}</strong>
          </div>
          <div class="day-balance ${toneClass}">
            <div class="hero-progress" aria-label="${escapeHtml(energyScaleLabel)}">
              <i class="hero-target-band" aria-hidden="true" style="left:${rangeStartPct}%; width:${rangeWidthPct}%"></i>
              <i class="hero-over-band" aria-hidden="true" style="left:${rangeEndPct}%; width:${overWidthPct}%"></i>
              <span class="hero-progress-fill" style="width:${pct}%"></span>
            </div>
            <div class="hero-scale-meta" aria-hidden="true">
              <span class="hero-scale-target"><strong>Objetivo</strong> ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal</span>
              <span class="hero-scale-spend"><strong>Gasto</strong> ${formatMacro(targets.maintenance)} kcal</span>
            </div>
          </div>
        </div>
        ${isSavedHistory ? "" : `<div class="day-context-grid context-controls">
          ${renderDayTrainingCard(context)}
          <label class="field">
            <span>Pasos hoy</span>
            <input name="steps" type="number" min="0" max="50000" step="500" placeholder="${escapeHtml(state.profile.steps)}" value="${escapeHtml(context.steps)}">
          </label>
        </div>`}
        ${renderRecoveryHint(day)}
        ${isSavedHistory ? "" : renderPreviousDayHint(day)}
      </section>
    `;
  }

  function renderHistoricalDayBanner(day) {
    if (!day.savedAt) return "";
    const totalMode = day.nutritionSnapshot ? "Totales protegidos" : "Totales recalculados";
    return `
      <div class="history-state-banner" role="status">
        <strong>Día guardado</strong>
        <span>Solo lectura</span>
        <span>Guardado ${escapeHtml(formatDateTime(day.savedAt))}</span>
        <span>${totalMode}</span>
      </div>
    `;
  }

  function renderRecoveryHint(day) {
    if (day.savedAt || !hasRecoverableClosedDay()) return "";
    const recovery = state.lastClosedDayRecovery;
    const sourceLabel = isIsoDate(recovery.sourceDate) ? formatDate(recovery.sourceDate) : "el último día";

    return `
      <div class="late-day-hint recovery-hint">
        <div>
          <strong>Día guardado y limpiado</strong>
          <span>Puedes recuperar una copia editable de ${sourceLabel}.</span>
        </div>
        <button class="secondary-action" type="button" data-action="recover-last-closed-day">Recuperar</button>
      </div>
    `;
  }

  function renderPreviousDayHint(day) {
    const suggestion = previousDaySuggestion(day);
    if (!suggestion) return "";

    if (suggestion.registered) {
      return `
        <div class="late-day-hint">
          <div>
            <strong>¿Este registro era de ayer?</strong>
            <span>Ayer está libre. Puedes moverlo a ${formatDate(suggestion.previousDate)} y dejar hoy limpio.</span>
          </div>
          <button class="secondary-action" type="button" data-action="move-to-previous-day">Mover a ayer</button>
        </div>
      `;
    }

    return `
      <div class="late-day-hint">
        <div>
          <strong>¿Sigues cerrando ayer?</strong>
          <span>Ayer está libre. Mueve este registro a ${formatDate(suggestion.previousDate)} antes de seguir.</span>
        </div>
        <div class="late-day-actions">
          <button class="secondary-action" type="button" data-action="use-previous-day">Usar ayer</button>
          <button class="quiet-action" type="button" data-action="register-previous-day">Registrar como ayer</button>
        </div>
      </div>
    `;
  }

  function dayToneClass(totals, kcalRange) {
    if (totals.kcal === 0) return "is-empty";
    if (totals.kcal > kcalRange.max) return "is-over";
    if (totals.kcal >= kcalRange.min) return "is-good";
    return "is-under";
  }

  function dominantMacro(macros = {}) {
    const protein = Nutrition.number(macros.protein) * 4;
    const carbs = Nutrition.number(macros.carbs) * 4;
    const fat = Nutrition.number(macros.fat) * 9;
    const fiber = Nutrition.number(macros.fiber);
    const entries = [
      ["protein", protein],
      ["carbs", carbs],
      ["fat", fat]
    ].sort((a, b) => b[1] - a[1]);

    if (fiber >= 8 && fiber * 6 >= entries[0][1]) return "fiber";
    if (entries[0][1] <= 0) return "energy";
    return entries[0][0];
  }

  function macroToneClass(macros = {}) {
    return `is-${dominantMacro(macros)}`;
  }

  function macroToneLabel(macros = {}) {
    const labels = {
      protein: "Proteína",
      carbs: "Hidratos",
      fat: "Grasas",
      fiber: "Fibra",
      energy: "Energía"
    };

    return labels[dominantMacro(macros)] || labels.energy;
  }

  function renderMeals(renderContext) {
    const aggregated = renderContext.summary.aggregate;
    const snapshotMeals = renderContext.day.savedAt && renderContext.day.nutritionSnapshot
      ? renderContext.day.nutritionSnapshot.meals || []
      : null;
    const isReadOnlyHistory = Boolean(renderContext.day.savedAt);

    refs.meals.innerHTML = `
      ${isReadOnlyHistory ? "" : renderSmartFoodSuggestions(renderContext.day)}
      ${isReadOnlyHistory ? "" : renderMealTemplates()}
      ${aggregated.meals.map((meal, index) => {
        const snapshotMeal = snapshotMeals ? snapshotMeals.find((item) => item.id === meal.id) : null;
        const collapsed = isMealCollapsed(meal);
        const foods = snapshotMeal ? snapshotMeal.items || [] : mealFoods(meal);
        const mealTotal = snapshotMeal?.total || meal.total;
        const foodCount = foods.length;
        const foodCountLabel = foodCount === 1 ? "1 alimento" : `${foodCount} alimentos`;
        const templateItems = mealTemplateItemsFromMeal(meal);
        const savedAsTemplate = Boolean(findMealTemplateBySignature(templateItems));
        const toneClass = macroToneClass(mealTotal);
        const toneLabel = macroToneLabel(mealTotal);
        return `
      <article class="meal-card meal-list ${toneClass} ${collapsed ? "is-collapsed" : ""}" data-meal-id="${meal.id}">
        <div class="meal-top">
          <button class="meal-number" type="button" data-action="toggle-meal" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${index + 1}</button>
          ${isReadOnlyHistory ? `
          <div class="meal-name is-read-only">
            <span class="sr-only">Nombre de la comida</span>
            <strong>${escapeHtml(meal.name)}</strong>
          </div>
          ` : `<label class="meal-name">
            <span class="sr-only">Nombre de la comida</span>
            <input class="meal-name-input" data-action="rename-meal" value="${escapeHtml(meal.name)}">
          </label>`}
          <div class="meal-total">
            <strong>${formatMacro(mealTotal.kcal)} kcal</strong>
            <span class="meal-share">${foodCountLabel} · ${toneLabel}</span>
          </div>
          ${isReadOnlyHistory ? "" : `<button class="icon-button soft save-template-action ${savedAsTemplate ? "is-active" : ""}" type="button" data-action="save-meal-template" title="${savedAsTemplate ? "Comida guardada" : "Guardar comida"}" aria-label="${savedAsTemplate ? "Comida guardada" : "Guardar comida"}">${icon(savedAsTemplate ? "starFilled" : "star")}</button>`}
          <button class="icon-button meal-collapse" type="button" data-action="toggle-meal" title="${collapsed ? "Abrir comida" : "Cerrar comida"}" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${icon("chevron")}</button>
          ${isReadOnlyHistory ? "" : `<button class="icon-button soft danger-action" type="button" data-action="remove-meal" title="Eliminar comida" aria-label="Eliminar comida">${icon("trash")}</button>`}
        </div>
        <div class="meal-body">
          <div class="meal-items">
            ${foods.length ? foods.map((item) => snapshotMeal ? renderSnapshotMealItem(item) : isReadOnlyHistory ? renderReadOnlyMealItem(item) : renderMealItem(item, meal)).join("") : `
              <p class="empty-copy">Sin alimentos todavía.</p>
            `}
          </div>
          ${isReadOnlyHistory ? "" : `<form class="meal-form add-food-row ${isMealAddOpen(meal) ? "" : "is-hidden"}" data-action="add-item" data-meal-id="${meal.id}" novalidate>
            <label class="meal-field food-select-field">
              <span>Alimento</span>
              <select name="foodId" aria-label="Alimento">
                <option value="">Selecciona alimento</option>
                ${renderFoodOptions(selectedFoodIdForMeal(meal))}
              </select>
            </label>
            <label class="meal-field grams-field">
              <span>Peso</span>
              <span class="weight-control">
                <input name="grams" type="text" inputmode="decimal" autocomplete="off" placeholder="300" aria-label="Peso en gramos">
                <span aria-hidden="true">g</span>
              </span>
            </label>
            <button class="icon-button add-button" type="button" data-action="add-food" title="Añadir alimento" aria-label="Añadir alimento">${icon("plus")}</button>
          </form>
          `}
          ${isReadOnlyHistory ? "" : `<button class="inline-add ${isMealAddOpen(meal) ? "is-hidden" : ""}" type="button" data-action="toggle-add-food">${icon("plus")} Añadir alimento</button>`}
        </div>
      </article>
      `;
      }).join("")}
      ${isReadOnlyHistory ? "" : `<button class="ghost-action add-meal-row" type="button" data-action="add-meal">+ Comida</button>`}
    `;
  }

  function isMealCollapsed(meal) {
    return uiState.collapsedMealIds.has(meal.id);
  }

  function isMealAddOpen(meal) {
    return uiState.addFoodMealIds.has(meal.id);
  }

  function renderMealTemplates() {
    const templates = state.mealTemplates || [];
    if (!templates.length) return "";

    return `
      <section class="meal-template-panel" aria-labelledby="meal-template-title">
        <div class="meal-template-head">
          <div>
            <span>Favoritas</span>
            <strong id="meal-template-title">Comidas guardadas</strong>
          </div>
          <span>${templates.length}</span>
        </div>
        <div class="meal-template-list">
          ${templates.map((template) => renderMealTemplate(template)).join("")}
        </div>
      </section>
    `;
  }

  function renderMealTemplate(template) {
    const total = mealTemplateTotal(template);
    const itemCount = template.items.length;
    const itemLabel = itemCount === 1 ? "1 alimento" : `${itemCount} alimentos`;
    const hasSnapshot = Array.isArray(template.itemSnapshots) && template.itemSnapshots.length;

    return `
      <article class="meal-template-card ${macroToneClass(total)}" data-template-id="${escapeHtml(template.id)}">
        <div class="meal-template-copy">
          <strong>${escapeHtml(template.name)}</strong>
          <span>${itemLabel}${hasSnapshot ? " · estable" : ""}</span>
        </div>
        <div class="meal-template-actions">
          <button class="secondary-action template-use-action" type="button" data-action="insert-meal-template">${icon("plus")} Usar</button>
          <button class="icon-button soft danger-action" type="button" data-action="remove-meal-template" title="Eliminar comida guardada" aria-label="Eliminar comida guardada">${icon("trash")}</button>
        </div>
      </article>
    `;
  }

  function activeFoods() {
    return state.foods.filter((food) => !food.deletedAt);
  }

  function sortFoods(foods) {
    return [...foods].sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
  }

  function selectedFoodIdForMeal(meal) {
    const foodId = uiState.selectedFoodByMealId.get(meal.id) || "";
    return activeFoods().some((food) => food.id === foodId) ? foodId : "";
  }

  function selectedFoodForMeal(meal) {
    const foodId = selectedFoodIdForMeal(meal);
    return foodId ? activeFoods().find((food) => food.id === foodId) : null;
  }

  function renderFoodOptions(selectedFoodId = "") {
    return sortFoods(activeFoods())
      .map((food) => `<option value="${escapeHtml(food.id)}" ${selected(selectedFoodId, food.id)}>${escapeHtml(food.name)}</option>`)
      .join("");
  }

  function foodCategory(food = {}) {
    const id = String(food.id || "");
    const name = Nutrition.normalize(food.name || "");

    if (MEAT_FOOD_IDS.has(id)) return "meat";
    if (FISH_FOOD_IDS.has(id)) return "fish";
    if (/\b(pollo|pavo|ternera|cerdo|jamon|carne)\b/.test(name)) return "meat";
    if (/\b(salmon|atun|bonito|merluza|pescado|bacalao|sardina)\b/.test(name)) return "fish";
    if (["greek-yogurt", "fresh-cheese", "whey-protein-scoop"].includes(id)) return "dairy";
    if (["banana", "blueberries", "watermelon", "melon"].includes(id)) return "fruit";
    if (["oats", "muesli-crunchy-zero", "oat-crunchy-rings"].includes(id)) return "breakfast-grain";
    if (["rice", "pasta", "gnocchi", "potato", "bread"].includes(id)) return "carb";
    if (id === "egg") return "egg";
    if (["green-garlic", "cherry-tomato"].includes(id)) return "vegetable";
    if (id === "lentils") return "legume";
    if (["olive-oil", "peanut-butter", "avocado"].includes(id)) return "fat";
    if (id.includes("cheese") || name.includes("queso") || name.includes("roquefort") || name.includes("mahon")) return "cheese";

    const protein = Nutrition.number(food.protein);
    const carbs = Nutrition.number(food.carbs);
    const fat = Nutrition.number(food.fat);
    if (fat > 8 && fat >= protein && fat >= carbs) return "fat";
    if (protein > 10 && protein >= carbs && protein >= fat) return "protein";
    if (carbs > 12 && carbs >= protein && carbs >= fat) return "carb";
    return "other";
  }

  function categoryPairingScore(sourceFood, candidateFood) {
    const source = foodCategory(sourceFood);
    const candidate = foodCategory(candidateFood);
    const matrix = {
      dairy: { fruit: 92, "breakfast-grain": 86, fat: 62, dairy: 40, carb: 18, meat: -45, fish: -35, protein: -35, vegetable: -24 },
      fruit: { dairy: 92, "breakfast-grain": 84, fat: 68, fruit: 38, meat: -45, fish: -35, protein: -35, vegetable: -22 },
      "breakfast-grain": { dairy: 88, fruit: 84, fat: 68, "breakfast-grain": 35, meat: -35, fish: -28, protein: -25 },
      meat: { carb: 88, vegetable: 82, fat: 64, legume: 44, cheese: 34, egg: 18, fruit: -42, dairy: -34, fish: -100 },
      fish: { carb: 88, vegetable: 84, fat: 68, legume: 38, cheese: 24, egg: 10, fruit: -42, dairy: -28, meat: -100 },
      protein: { carb: 84, vegetable: 76, fat: 58, legume: 38, cheese: 30, fruit: -38, dairy: -30 },
      egg: { carb: 84, vegetable: 80, fat: 74, cheese: 58, meat: 18, fish: 10, protein: 20, fruit: -38 },
      vegetable: { meat: 84, fish: 84, egg: 80, carb: 72, fat: 68, cheese: 46, protein: 42, fruit: -28 },
      carb: { meat: 86, fish: 86, vegetable: 76, cheese: 70, fat: 62, legume: 52, protein: 38, fruit: 22 },
      legume: { carb: 84, vegetable: 78, fat: 62, meat: 36, fish: 30, protein: 30, cheese: 12 },
      fat: { carb: 72, vegetable: 70, fish: 68, meat: 62, egg: 62, fruit: 58, dairy: 42, protein: 34 },
      cheese: { carb: 80, vegetable: 64, egg: 58, meat: 46, fish: 32, protein: 36, fat: 28, fruit: -24 },
      other: { carb: 30, vegetable: 28, meat: 24, fish: 24, protein: 24, fruit: 20, dairy: 18 }
    };

    return matrix[source]?.[candidate] ?? 0;
  }

  function semanticPairingIds(sourceFood, activeById) {
    const explicit = FOOD_PAIRING_RULES[sourceFood.id] || [];
    if (explicit.length) return explicit.filter((id) => activeById.has(id));

    return activeFoods()
      .filter((food) => food.id !== sourceFood.id)
      .map((food) => ({ id: food.id, score: categoryPairingScore(sourceFood, food) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .map((item) => item.id);
  }

  function preferredGramsForFood(food, gramsCounts) {
    if (gramsCounts && gramsCounts.size) {
      return [...gramsCounts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    }
    return Nutrition.number(food.servingGrams) || 100;
  }

  function combinationStatsForFood(sourceFoodId) {
    const activeById = new Map(activeFoods().map((food) => [food.id, food]));
    const stats = new Map();

    function addPair(candidateId, grams, date, weight) {
      const food = activeById.get(candidateId);
      if (!food || candidateId === sourceFoodId) return;

      const roundedGrams = Math.max(5, Math.round(Nutrition.number(grams || food.servingGrams || 100) / 5) * 5);
      const stat = stats.get(candidateId) || {
        food,
        count: 0,
        gramsCounts: new Map(),
        lastDate: ""
      };

      stat.count += weight;
      stat.gramsCounts.set(roundedGrams, (stat.gramsCounts.get(roundedGrams) || 0) + weight);
      stat.lastDate = String(date || "") > stat.lastDate ? String(date || "") : stat.lastDate;
      stats.set(candidateId, stat);
    }

    Object.values(state.days || {}).forEach((day) => {
      if (!day) return;
      (day.meals || []).forEach((meal) => {
        const items = mealFoods(meal).filter((item) => activeById.has(item.foodId));
        if (!items.some((item) => item.foodId === sourceFoodId)) return;
        items.forEach((item) => addPair(item.foodId, item.grams, day.date, 1));
      });
    });

    (state.mealTemplates || []).forEach((template) => {
      const items = (template.items || []).filter((item) => activeById.has(item.foodId));
      if (!items.some((item) => item.foodId === sourceFoodId)) return;
      items.forEach((item) => addPair(item.foodId, item.grams, template.updatedAt || template.createdAt, 0.75));
    });

    return stats;
  }

  function mealFoodIdSet(meal) {
    return new Set(mealFoods(meal).map((item) => item.foodId).filter(Boolean));
  }

  function mealFoodCategories(meal, activeById) {
    return new Set(mealFoods(meal)
      .map((item) => activeById.get(item.foodId))
      .filter(Boolean)
      .map(foodCategory));
  }

  function violatesMeatFishRule(sourceFood, candidateFood, meal, activeById) {
    const mealCategories = mealFoodCategories(meal, activeById);
    const sourceCategory = foodCategory(sourceFood);
    const candidateCategory = foodCategory(candidateFood);
    const mealHasMeat = mealCategories.has("meat");
    const mealHasFish = mealCategories.has("fish");
    const hasMeat = sourceCategory === "meat" || mealHasMeat;
    const hasFish = sourceCategory === "fish" || mealHasFish;

    return (candidateCategory === "meat" && hasFish)
      || (candidateCategory === "fish" && hasMeat)
      || (candidateCategory === "meat" && mealHasMeat)
      || (candidateCategory === "fish" && mealHasFish);
  }

  function foodCombinationRecommendations(sourceFood, meal, limit = 4) {
    const active = activeFoods();
    const activeById = new Map(active.map((food) => [food.id, food]));
    const blockedIds = mealFoodIdSet(meal);
    blockedIds.add(sourceFood.id);

    const stats = combinationStatsForFood(sourceFood.id);
    const semanticIds = semanticPairingIds(sourceFood, activeById);
    const semanticRank = new Map(semanticIds.map((id, index) => [id, index]));
    const byId = new Map();

    active.forEach((food) => {
      if (blockedIds.has(food.id)) return;
      if (violatesMeatFishRule(sourceFood, food, meal, activeById)) return;

      const stat = stats.get(food.id);
      const semanticIndex = semanticRank.has(food.id) ? semanticRank.get(food.id) : null;
      const categoryScore = categoryPairingScore(sourceFood, food);
      const semanticScore = semanticIndex === null ? 0 : Math.max(25, 110 - semanticIndex * 12);
      const historicalScore = stat ? stat.count * 140 : 0;
      const score = historicalScore + semanticScore + Math.max(0, categoryScore);

      if (score <= 0) return;
      byId.set(food.id, {
        food,
        grams: preferredGramsForFood(food, stat?.gramsCounts),
        count: stat ? stat.count : 0,
        source: stat ? "habitual" : "encaja",
        score
      });
    });

    const fallback = active
      .filter((food) => !blockedIds.has(food.id)
        && !byId.has(food.id)
        && !violatesMeatFishRule(sourceFood, food, meal, activeById))
      .map((food) => ({
        food,
        grams: preferredGramsForFood(food),
        count: 0,
        source: "encaja",
        score: categoryPairingScore(sourceFood, food)
      }))
      .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }));

    fallback.forEach((item) => {
      if (byId.size >= active.length) return;
      byId.set(item.food.id, item);
    });

    return [...byId.values()]
      .sort((a, b) => b.score - a.score
        || b.count - a.count
        || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }))
      .slice(0, limit);
  }

  function frequentFoodSuggestions(limit = 5) {
    const activeById = new Map(activeFoods().map((food) => [food.id, food]));
    const stats = new Map();

    Object.values(state.days || {}).forEach((day) => {
      if (!day) return;
      (day.meals || []).forEach((meal) => {
        mealFoods(meal).forEach((item) => {
          const food = activeById.get(item.foodId);
          const grams = Nutrition.number(item.grams);
          if (!food || grams <= 0) return;

          const roundedGrams = Math.max(5, Math.round(grams / 5) * 5);
          const stat = stats.get(food.id) || {
            food,
            count: 0,
            gramsCounts: new Map(),
            lastDate: ""
          };

          stat.count += 1;
          stat.gramsCounts.set(roundedGrams, (stat.gramsCounts.get(roundedGrams) || 0) + 1);
          stat.lastDate = String(day.date || "") > stat.lastDate ? String(day.date || "") : stat.lastDate;
          stats.set(food.id, stat);
        });
      });
    });

    const suggestions = [...stats.values()]
      .map((stat) => {
        const [grams] = [...stat.gramsCounts.entries()]
          .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0] || [100];
        return {
          food: stat.food,
          grams,
          count: stat.count,
          lastDate: stat.lastDate
        };
      })
      .sort((a, b) => b.count - a.count
        || String(b.lastDate).localeCompare(String(a.lastDate))
        || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }))
      .slice(0, limit);

    if (suggestions.length >= limit) return suggestions;

    sortFoods(activeFoods().filter((food) => food.favorite))
      .forEach((food) => {
        if (suggestions.some((item) => item.food.id === food.id)) return;
        suggestions.push({
          food,
          grams: 100,
          count: 0,
          lastDate: ""
        });
      });

    return suggestions.slice(0, limit);
  }

  function targetMealForFrequentFood(day) {
    let meal = day.meals.find((item) => !mealFoods(item).length)
      || [...day.meals].reverse().find((item) => mealFoods(item).length)
      || day.meals[0];

    if (!meal) {
      meal = createMeal("Comida 1");
      day.meals.push(meal);
    }

    return meal;
  }

  function currentRecommendationContext(day) {
    const selectedMeal = (day.meals || []).find((meal) => isMealAddOpen(meal) && selectedFoodForMeal(meal));
    if (selectedMeal) {
      return {
        meal: selectedMeal,
        sourceFood: selectedFoodForMeal(selectedMeal),
        item: { id: "" },
        sourceContext: "selected-food",
        eyebrow: "Para esta comida",
        titlePrefix: "Combina con"
      };
    }

    const focus = uiState.recommendationFocus;
    if (focus) {
      const meal = (day.meals || []).find((item) => item.id === focus.mealId);
      const item = meal ? mealFoods(meal).find((mealItem) => mealItem.id === focus.itemId && mealItem.foodId === focus.foodId) : null;
      const sourceFood = item ? activeFoods().find((food) => food.id === item.foodId) : null;
      if (meal && item && sourceFood) {
        return {
          meal,
          sourceFood,
          item,
          sourceContext: "meal-item",
          eyebrow: "Ahora",
          titlePrefix: "Combina con"
        };
      }
      uiState.recommendationFocus = null;
    }

    for (let index = (day.meals || []).length - 1; index >= 0; index -= 1) {
      const meal = day.meals[index];
      const items = mealFoods(meal);
      for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
        const item = items[itemIndex];
        const sourceFood = activeFoods().find((food) => food.id === item.foodId);
        if (sourceFood) {
          return {
            meal,
            sourceFood,
            item,
            sourceContext: "meal-item",
            eyebrow: "Ahora",
            titlePrefix: "Combina con"
          };
        }
      }
    }

    return null;
  }

  function renderContextualFoodSuggestions(day) {
    const context = currentRecommendationContext(day);
    if (!context) return "";

    const recommendations = foodCombinationRecommendations(context.sourceFood, context.meal, 4);
    if (!recommendations.length) return "";

    const targetName = context.meal?.name || "la comida";

    return `
      <section class="frequent-food-panel is-contextual-combo" data-meal-id="${escapeHtml(context.meal.id)}" aria-labelledby="frequent-food-title">
        <div class="frequent-food-head">
          <div>
            <strong id="frequent-food-title">${escapeHtml(`${context.titlePrefix} ${context.sourceFood.name}`)}</strong>
          </div>
        </div>
        <div class="frequent-food-list">
          ${recommendations.map((recommendation) => {
            const toneClass = macroToneClass(recommendation.food);
            const toneLabel = recommendation.source === "habitual" ? "Lo sueles combinar" : macroToneLabel(recommendation.food);
            const sprite = renderFoodSprite(recommendation.food);
            return `
              <button
                class="frequent-food-card ${toneClass} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-food-combo"
                data-food-id="${escapeHtml(recommendation.food.id)}"
                data-grams="${escapeHtml(recommendation.grams)}"
                data-source-food-id="${escapeHtml(context.sourceFood.id)}"
                data-source-item-id="${escapeHtml(context.item.id || "")}"
                data-source-context="${escapeHtml(context.sourceContext)}"
                aria-label="${escapeHtml(`Añadir ${formatMacro(recommendation.grams)} g de ${recommendation.food.name} a ${targetName}`)}"
              >
                ${sprite}
                <strong>${escapeHtml(recommendation.food.name)}</strong>
                <span>${formatMacro(recommendation.grams)} g · ${escapeHtml(combinationReason(recommendation))}</span>
                <small>${escapeHtml(toneLabel)}</small>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderSmartFoodSuggestions(day) {
    return renderContextualFoodSuggestions(day) || renderFrequentFoodSuggestions(day);
  }

  function renderFrequentFoodSuggestions(day) {
    const suggestions = frequentFoodSuggestions(5);
    if (!suggestions.length) return "";

    const targetMeal = targetMealForFrequentFood(day);
    const targetName = targetMeal?.name || "la comida";

    return `
      <section class="frequent-food-panel" aria-labelledby="frequent-food-title">
        <div class="frequent-food-head">
          <div>
            <strong id="frequent-food-title">Comes a menudo</strong>
          </div>
        </div>
        <div class="frequent-food-list">
          ${suggestions.map((suggestion) => {
            const timesLabel = suggestion.count === 1
              ? "1 vez"
              : suggestion.count > 1 ? `${suggestion.count} veces` : "favorito";
            const toneClass = macroToneClass(suggestion.food);
            const toneLabel = macroToneLabel(suggestion.food);
            const sprite = renderFoodSprite(suggestion.food);
            return `
              <button
                class="frequent-food-card ${toneClass} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-frequent-food"
                data-food-id="${escapeHtml(suggestion.food.id)}"
                data-grams="${escapeHtml(suggestion.grams)}"
                aria-label="${escapeHtml(`Añadir ${formatMacro(suggestion.grams)} g de ${suggestion.food.name} a ${targetName}`)}"
              >
                ${sprite}
                <strong>${escapeHtml(suggestion.food.name)}</strong>
                <span>${formatMacro(suggestion.grams)} g habitual · ${timesLabel}</span>
                <small>${toneLabel}</small>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderMealMacros(macros) {
    return `
      <span class="meal-macros" aria-label="${escapeHtml(`Proteína ${formatMacro(macros.protein)}g, carbohidratos ${formatMacro(macros.carbs)}g, grasas ${formatMacro(macros.fat)}g`)}">
        <span class="meal-macro is-protein">P ${formatMacro(macros.protein)}g</span>
        <span class="meal-macro-separator" aria-hidden="true">/</span>
        <span class="meal-macro is-carbs">C ${formatMacro(macros.carbs)}g</span>
        <span class="meal-macro-separator" aria-hidden="true">/</span>
        <span class="meal-macro is-fat">G ${formatMacro(macros.fat)}g</span>
      </span>
    `;
  }

  function isFoodComboOpen(meal, item) {
    return uiState.comboContext
      && uiState.comboContext.mealId === meal.id
      && uiState.comboContext.itemId === item.id
      && uiState.comboContext.foodId === item.foodId;
  }

  function combinationReason(recommendation) {
    if (recommendation.source !== "habitual") return "Encaja bien";
    const uses = Math.max(1, Math.round(recommendation.count));
    return uses === 1 ? "Ya lo combinaste" : `${uses} veces contigo`;
  }

  function renderFoodComboPanel(sourceFood, meal, item, options = {}) {
    const recommendations = foodCombinationRecommendations(sourceFood, meal, 4);
    if (!recommendations.length) return "";

    return `
      <section class="food-combo-panel ${escapeHtml(options.className || "")}" aria-label="${escapeHtml(`Alimentos que combinan con ${sourceFood.name}`)}">
        <div class="food-combo-head">
          <span>Combina con</span>
          <strong>${escapeHtml(sourceFood.name)}</strong>
        </div>
        <div class="food-combo-list">
          ${recommendations.map((recommendation) => {
            const sprite = renderFoodSprite(recommendation.food);
            return `
              <button
                class="food-combo-card ${macroToneClass(recommendation.food)} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-food-combo"
                data-food-id="${escapeHtml(recommendation.food.id)}"
                data-grams="${escapeHtml(recommendation.grams)}"
                data-source-food-id="${escapeHtml(sourceFood.id)}"
                data-source-item-id="${escapeHtml(item.id || "")}"
                data-source-context="${escapeHtml(options.sourceContext || "meal-item")}"
              >
                ${sprite}
                <span>
                  <strong>${escapeHtml(recommendation.food.name)}</strong>
                  <small>${formatMacro(recommendation.grams)} g · ${escapeHtml(combinationReason(recommendation))}</small>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderMealItem(item, meal) {
    const food = Nutrition.findFoodById(state.foods, item.foodId);
    if (!food && item.foodSnapshot) return renderSnapshotMealItem({
      id: item.id,
      foodName: item.foodSnapshot.name,
      grams: item.grams,
      macros: Nutrition.foodMacros(item.foodSnapshot.per100 || {}, item.grams)
    });
    if (!food) return "";
    const macros = Nutrition.foodMacros(food, item.grams);
    const sprite = renderFoodSprite(food);
    const isComboOpen = isFoodComboOpen(meal, item);

    return `
      <div class="food-row ${macroToneClass(macros)}" data-item-id="${item.id}">
        <button
          class="food-main food-combo-trigger ${sprite ? "has-sprite" : ""} ${isComboOpen ? "is-active" : ""}"
          type="button"
          data-action="show-food-combos"
          data-food-id="${escapeHtml(food.id)}"
          data-item-id="${escapeHtml(item.id)}"
          aria-expanded="${isComboOpen ? "true" : "false"}"
          aria-label="${escapeHtml(`Ver alimentos que combinan con ${food.name}`)}"
        >
          ${sprite}
          <span class="food-copy">
            <strong>${escapeHtml(food.name)}</strong>
            <span class="food-amount">${formatMacro(item.grams)} g</span>
          </span>
        </button>
        <button class="icon-button soft danger-action" type="button" data-action="remove-item" title="Quitar alimento" aria-label="Quitar alimento">${icon("trash")}</button>
      </div>
      ${isComboOpen ? renderFoodComboPanel(food, meal, item) : ""}
    `;
  }

  function renderReadOnlyMealItem(item) {
    const food = Nutrition.findFoodById(state.foods, item.foodId);
    if (!food && item.foodSnapshot) return renderSnapshotMealItem({
      id: item.id,
      foodName: item.foodSnapshot.name,
      grams: item.grams,
      macros: Nutrition.foodMacros(item.foodSnapshot.per100 || {}, item.grams)
    });

    const foodName = food ? food.name : "Alimento guardado";
    const macros = food ? Nutrition.foodMacros(food, item.grams) : Nutrition.zeroMacros();
    return renderSnapshotMealItem({
      id: item.id,
      foodName,
      grams: item.grams,
      macros
    });
  }

  function renderSnapshotMealItem(item) {
    const macros = item.macros || Nutrition.zeroMacros();
    const sprite = renderFoodSprite(item.foodId || item.foodName);
    return `
      <div class="food-row ${macroToneClass(macros)}" data-item-id="${escapeHtml(item.id)}">
        <div class="food-main ${sprite ? "has-sprite" : ""}">
          ${sprite}
          <span class="food-copy">
            <strong>${escapeHtml(item.foodName || "Alimento guardado")}</strong>
            <span class="food-amount">${formatMacro(item.grams)} g</span>
          </span>
        </div>
      </div>
    `;
  }

  function renderSummary(renderContext) {
    const { summary } = renderContext;
    const totals = summary.total;
    const targets = summary.targets;
    const energy = summary.energy;
    const kcalRange = summary.kcalRange;
    const diagnosis = summary.diagnosis;

    refs.macroSummary.innerHTML = `
      <section class="summary-hero ${diagnosis.className}">
        <h2>${escapeHtml(diagnosis.action)}</h2>
        <p>${energy.metric}</p>
        <small>${escapeHtml(diagnosis.body)}</small>
      </section>
      <section class="diagnosis-card ${diagnosis.className}" aria-labelledby="diagnosis-title">
        <div class="diagnosis-head">
          <span>Guía del día</span>
          <strong>${escapeHtml(diagnosis.priority)}</strong>
        </div>
        <h3 id="diagnosis-title">${escapeHtml(diagnosis.title)}</h3>
        ${renderDiagnosisSuggestions(
          renderContext.day.savedAt || uiState.view === "foods" ? [] : diagnosis.suggestions,
          suggestionTargetMealLabel(renderContext.day)
        )}
      </section>
      <details class="summary-more">
        <summary>Ver números del día</summary>
        <div class="target-strip">
          <div>
            <span>Óptimo</span>
            <strong>${formatMacro(targets.kcal)} kcal</strong>
          </div>
          <div>
            <span>Mant.</span>
            <strong>${formatMacro(targets.maintenance)} kcal</strong>
          </div>
          <div>
            <span>Act.</span>
            <strong>x${Nutrition.formatNumber(targets.activityMultiplier, 2)}</strong>
          </div>
        </div>
        <div class="kcal-range-note">
          Rango ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal
        </div>
        <div class="summary-focus-list">
          ${renderNutritionFocus(summary.focus)}
        </div>
      </details>
    `;
  }

  function suggestionTargetMealLabel(day) {
    if (!day.meals.length) return "Comida 1";
    const meal = day.meals.find((item) => !mealFoods(item).length)
      || day.meals[day.meals.length - 1];
    return meal?.name || "Comida";
  }

  function renderDiagnosisSuggestions(suggestions = [], targetMealName = "Comida") {
    if (!suggestions.length) return "";

    return `
      <ul class="diagnosis-suggestions" aria-label="Sugerencias concretas">
        ${suggestions.slice(0, 3).map((suggestion) => {
          const grams = Nutrition.formatNumber(suggestion.grams || 0);
          return `
          <li>
            <span class="diagnosis-dot" aria-hidden="true"></span>
            <span>
              <strong>${escapeHtml(suggestion.label)}</strong>
              <small>${escapeHtml(suggestion.detail)}</small>
            </span>
            <button
              type="button"
              data-action="add-diagnosis-suggestion"
              data-food-id="${escapeHtml(suggestion.foodId || "")}"
              data-grams="${escapeHtml(suggestion.grams || "")}"
              aria-label="${escapeHtml(`Añadir ${grams} g de ${suggestion.label} a ${targetMealName}`)}"
            >Añadir</button>
          </li>
        `;
        }).join("")}
      </ul>
    `;
  }

  function renderNutritionFocus(rows) {
    return rows.map((row) => `
      <div class="summary-focus-row ${row.className}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.value)}</strong>
        <small>${escapeHtml(row.detail)}</small>
      </div>
    `).join("");
  }

  function renderMacroCards(renderContext) {
    refs.macroCards.innerHTML = "";
  }

  function renderEquivalences(renderContext) {
    const { equivalences, rangeLeft } = renderContext.summary;

    refs.equivalences.innerHTML = `
      <section class="equivalence-block">
        <h3>Equivalencias útiles</h3>
        ${renderEquivalenceGroup("Proteína", "protein", equivalences.protein, rangeLeft.protein)}
        ${renderEquivalenceGroup("Carbohidratos", "carbs", equivalences.carbs, rangeLeft.carbs)}
        ${renderEquivalenceGroup("Grasas", "fat", equivalences.fat, rangeLeft.fat)}
      </section>
    `;
  }

  function renderEquivalenceGroup(label, macro, items, remainingValue) {
    if (remainingValue <= 0) {
      return `
        <details class="equivalence-details is-done">
          <summary>
            <span>${label}</span>
            <strong>Cubierto</strong>
          </summary>
        </details>
      `;
    }

    return `
      <details class="equivalence-details" ${macro === "carbs" || macro === "fat" ? "open" : ""}>
        <summary>
          <span>${label}</span>
          <strong>${formatMacro(remainingValue)}g por cubrir</strong>
        </summary>
        <ul>
          ${items.map((item) => `
            <li>
              <span>${escapeHtml(item.food.name)}</span>
              <strong>${formatMacro(item.grams)}g${servingText(item)}</strong>
            </li>
          `).join("")}
        </ul>
      </details>
    `;
  }

  function servingText(item) {
    if (!item.food.servingLabel || !item.servings) return "";
    const servings = Nutrition.round(item.servings, 1);
    const plural = servings > 1.05 ? "s" : "";
    return ` / ${Nutrition.formatNumber(servings, 1)} ${item.food.servingLabel}${plural}`;
  }

  function renderFoodManager() {
    const foods = filterManagedFoods();
    const favorites = activeFoods().filter((food) => food.favorite).length;

    refs.libraryPanel.innerHTML = `
      <div class="food-manager-head">
        <div>
          <p>Biblioteca</p>
          <h2>Alimentos</h2>
        </div>
        <div class="food-manager-stats">
          <span>${activeFoods().length} activos</span>
          <span>${favorites} favoritos</span>
        </div>
      </div>
      <div class="food-toolbar">
        <label class="field">
          <span>Buscar</span>
          <input name="foodSearch" type="search" placeholder="Salmón, arroz, queso..." value="${escapeHtml(uiState.foodSearch)}">
        </label>
      </div>
      <details class="food-create">
        <summary>+ Añadir alimento</summary>
        ${renderFoodForm(null, "create-food")}
      </details>
      <div class="food-card-list">
        ${renderManagedFoodList(foods)}
      </div>
    `;
  }

  function renderManagedFoodList(foods = filterManagedFoods()) {
    if (!foods.length) return `<p class="empty-copy">No hay alimentos con ese filtro.</p>`;
    return foods.map((food) => renderFoodCard(food)).join("");
  }

  function filterManagedFoods() {
    const query = Nutrition.normalize(uiState.foodSearch);
    const foods = sortFoods(activeFoods());
    if (!query) return foods;

    return foods.filter((food) => {
      const names = [food.name, ...(food.aliases || [])].map(Nutrition.normalize);
      return names.some((name) => name.includes(query));
    });
  }

  function renderFoodCard(food) {
    if (uiState.editingFoodId === food.id) {
      return `
        <article class="food-card is-editing" data-food-id="${escapeHtml(food.id)}">
          <div class="food-card-top">
            <strong>Editar alimento</strong>
            <button class="icon-button soft" type="button" data-action="cancel-edit-food" aria-label="Cancelar edición">x</button>
          </div>
          ${renderFoodForm(food, "update-food")}
        </article>
      `;
    }

    const macroLabel = `Macros por 100g: proteína ${formatMacro(food.protein)}g, carbohidratos ${formatMacro(food.carbs)}g, grasas ${formatMacro(food.fat)}g`;

    const sprite = renderFoodSprite(food);

    return `
      <article class="food-card" data-food-id="${escapeHtml(food.id)}">
        <div class="food-card-main ${sprite ? "has-sprite" : ""}">
          ${sprite}
          <div class="food-card-copy">
            <div class="food-card-title">
              <strong>${escapeHtml(food.name)}</strong>
              <span>${formatMacro(food.kcal)} kcal/100g</span>
            </div>
            <div class="food-macro-tags">
              <span>P ${formatMacro(food.protein)}g</span>
              <span>C ${formatMacro(food.carbs)}g</span>
              <span>G ${formatMacro(food.fat)}g</span>
              <span>F ${formatMacro(food.fiber || 0)}g</span>
            </div>
          </div>
          <div class="macro-donut-wrap" role="img" aria-label="${escapeHtml(macroLabel)}">
            <div class="macro-donut" style="${donutStyle(food)}" aria-hidden="true"></div>
          </div>
        </div>
        <div class="food-card-actions">
          <button class="star-button ${food.favorite ? "is-active" : ""}" type="button" data-action="toggle-favorite" title="Favorito" aria-label="${food.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}">${icon(food.favorite ? "starFilled" : "star")}</button>
          <button class="ghost-action icon-action compact-action" type="button" data-action="edit-food" title="Editar alimento" aria-label="Editar alimento">${icon("pencil")}</button>
          <button class="ghost-action icon-action compact-action danger-action" type="button" data-action="delete-food" title="Eliminar alimento" aria-label="Eliminar alimento">${icon("trash")}</button>
        </div>
      </article>
    `;
  }

  function renderFoodForm(food, action) {
    const values = food || {
      name: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: 0,
      servingLabel: "ración",
      servingGrams: 100
    };

    return `
      <form class="library-form" data-action="${action}" ${food ? `data-food-id="${escapeHtml(food.id)}"` : ""} novalidate>
        <div class="custom-grid">
          <label class="field">
            <span>Nombre</span>
            <input name="name" value="${escapeHtml(values.name)}" placeholder="Merluza" required>
          </label>
          <label class="field">
            <span>kcal/100g</span>
            <input name="kcal" type="number" min="0" step="1" value="${escapeHtml(values.kcal)}" required>
          </label>
          <label class="field">
            <span>Proteína</span>
            <input name="protein" type="number" min="0" step="0.1" value="${escapeHtml(values.protein)}" required>
          </label>
          <label class="field">
            <span>Carbohidratos</span>
            <input name="carbs" type="number" min="0" step="0.1" value="${escapeHtml(values.carbs)}" required>
          </label>
          <label class="field">
            <span>Grasas</span>
            <input name="fat" type="number" min="0" step="0.1" value="${escapeHtml(values.fat)}" required>
          </label>
          <label class="field">
            <span>Fibra</span>
            <input name="fiber" type="number" min="0" step="0.1" value="${escapeHtml(values.fiber || 0)}">
          </label>
          <label class="field">
            <span>Etiqueta ración</span>
            <input name="servingLabel" value="${escapeHtml(values.servingLabel || "ración")}" placeholder="ración">
          </label>
          <label class="field">
            <span>Gramos/ración</span>
            <input name="servingGrams" type="number" min="1" step="1" value="${escapeHtml(values.servingGrams || 100)}">
          </label>
        </div>
        <div class="library-form-actions">
          <button class="secondary-action" type="submit">${food ? "Guardar cambios" : "Guardar alimento"}</button>
          ${food ? `<button class="ghost-action" type="button" data-action="cancel-edit-food">Cancelar</button>` : ""}
        </div>
      </form>
    `;
  }

  function donutStyle(food) {
    const protein = Math.max(Nutrition.number(food.protein) * 4, 0);
    const carbs = Math.max(Nutrition.number(food.carbs) * 4, 0);
    const fat = Math.max(Nutrition.number(food.fat) * 9, 0);
    const total = protein + carbs + fat;
    if (!total) return "background: var(--macro-empty)";

    const proteinEnd = (protein / total) * 100;
    const carbsEnd = proteinEnd + (carbs / total) * 100;
    return `background: conic-gradient(var(--macro-protein) 0 ${proteinEnd}%, var(--macro-carbs) ${proteinEnd}% ${carbsEnd}%, var(--macro-fat) ${carbsEnd}% 100%)`;
  }

  function renderHistory() {
    const savedDays = Object.values(state.days)
      .filter((day) => day.savedAt)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (!savedDays.length) {
      refs.history.innerHTML = `<p class="empty-copy">Cuando registres un día aparecerá aquí.</p>`;
      return;
    }

    refs.history.innerHTML = `
      <div class="history-list">
        ${savedDays.map((day) => renderHistoryDay(day)).join("")}
      </div>
    `;
  }

  function renderHistoryDay(day) {
    const total = dayTotalForHistory(day);
    const repeatLabel = "Repetir este día en el día actual";
    return `
      <div class="history-row">
        <button class="history-open-button" type="button" data-action="load-day" data-date="${escapeHtml(day.date)}">
          <strong>${formatDate(day.date)}</strong>
          <span>${formatMacro(total.kcal)} kcal</span>
        </button>
        <div class="history-side">
          <div class="history-macros">
            <span class="macro-text is-protein">P ${formatMacro(total.protein)}g</span>
            <span class="macro-text is-carbs">C ${formatMacro(total.carbs)}g</span>
            <span class="macro-text is-fat">G ${formatMacro(total.fat)}g</span>
          </div>
          <button class="secondary-action history-repeat-action" type="button" data-action="repeat-day" data-date="${escapeHtml(day.date)}" title="${repeatLabel}" aria-label="${repeatLabel}">Repetir hoy</button>
        </div>
      </div>
    `;
  }

  function renderAnalysis(renderContext) {
    const savedDays = Object.values(state.days)
      .filter((day) => day.savedAt)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    if (!savedDays.length) {
      refs.analysis.innerHTML = "";
      return;
    }

    const totals = savedDays.reduce((acc, day) => {
      addTotals(acc, dayTotalForHistory(day));
      return acc;
    }, Nutrition.zeroMacros());

    const days = savedDays.length;
    const avg = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / days]));
    const targets = renderContext.summary.targets;

    refs.analysis.innerHTML = `
      <section class="analysis-block">
        <h3>Media últimos ${days}</h3>
        <div class="analysis-grid">
          <span class="analysis-metric macro-kcal">kcal <strong>${formatMacro(avg.kcal)}</strong></span>
          <span class="analysis-metric macro-protein">Prot <strong>${formatMacro(avg.protein)}g</strong></span>
          <span class="analysis-metric macro-carbs">Carb <strong>${formatMacro(avg.carbs)}g</strong></span>
          <span class="analysis-metric macro-fat">Grasa <strong>${formatMacro(avg.fat)}g</strong></span>
        </div>
        <p>${formatMacro((avg.protein / Math.max(targets.protein, 1)) * 100)}% de la proteína objetivo.</p>
      </section>
    `;
  }

  function addTotals(total, macros) {
    Object.keys(total).forEach((key) => {
      total[key] += Nutrition.number(macros[key]);
    });
    return total;
  }

  function handleProfileClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    event.preventDefault();

    if (button.dataset.action === "edit-profile") {
      uiState.view = "profile";
      uiState.editingFoodId = "";
      clearPendingUndo({ hideToast: true });
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.action === "toggle-library") {
      uiState.view = uiState.view === "foods" ? "diary" : "foods";
      uiState.editingFoodId = "";
      render();
    }
  }

  function handleProfileEditorChange(event) {
    if (event.target.name !== "avatarId") return;

    refs.profileEditor.querySelectorAll(".avatar-option").forEach((option) => {
      const input = option.querySelector("input[name='avatarId']");
      option.classList.toggle("is-selected", Boolean(input?.checked));
    });
  }

  function handleProfileEditorClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "discard-profile") {
      event.preventDefault();
      uiState.view = "diary";
      render();
      showToast("Cambios descartados.");
    }
  }

  function handleProfileEditorSubmit(event) {
    const form = event.target.closest("form[data-action='profile-editor']");
    if (!form) return;

    event.preventDefault();

    const data = new FormData(form);
    const numericFields = new Set(["age", "height", "weight", "trainingDays", "steps"]);
    const nextProfile = { ...state.profile };

    ["profileName", "sex", "activity", "goal", "avatarId"].forEach((name) => {
      const value = String(data.get(name) || "").trim();
      if (value) nextProfile[name] = value;
    });

    numericFields.forEach((name) => {
      nextProfile[name] = Nutrition.number(data.get(name));
    });

    nextProfile.profileName = String(nextProfile.profileName || "").trim() || "Mi perfil";
    if (!PROFILE_PIXEL_SPRITES[nextProfile.avatarId]) nextProfile.avatarId = profileAvatarId(nextProfile);

    state.profile = nextProfile;
    uiState.view = "diary";
    saveAndRender("Perfil guardado.");
  }

  function handleSideNavClick(event) {
    const button = event.target.closest("button[data-nav]");
    if (!button) return;

    const target = button.dataset.nav;
    clearPendingUndo({ hideToast: true });
    uiState.activeNav = target;

    if (target === "foods") {
      uiState.view = "foods";
      uiState.editingFoodId = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    uiState.view = "diary";
    uiState.editingFoodId = "";
    render();

    if (target === "goals") {
      document.querySelector(".summary-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (target === "history") {
      refs.historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDayContextChange(event) {
    const field = event.target;
    if (!field.name) return;

    const day = currentDay();
    if (day.savedAt) {
      showToast("Los días guardados son de solo lectura.");
      renderDayContext(getRenderContext());
      return;
    }

    if (field.name === "steps") {
      day.context.steps = field.value ? Nutrition.number(field.value) : "";
    } else {
      day.context[field.name] = field.value;
      if (field.name === "training" && field.value === "none") {
        day.context.intensity = "normal";
      }
    }
    saveAndRender();
  }

  function setDayContextOption(field, value) {
    const optionMap = {
      intensity: Data.INTENSITY_LEVELS
    };
    if (field !== "training" && (!optionMap[field] || !optionMap[field].some((item) => item.id === value))) return;
    if (field === "training" && !Data.TRAINING_TYPES.some((item) => item.id === value)) return;

    const day = currentDay();
    if (day.savedAt) {
      showToast("Los dÃ­as guardados son de solo lectura.");
      renderDayContext(getRenderContext());
      return;
    }

    if (field === "training") {
      const nextValue = nextTrainingSelection(day.context.training, value);
      if (day.context.training === nextValue) return;
      day.context.training = nextValue;
      if (nextValue === "none") {
        day.context.intensity = "normal";
      }
      saveAndRender();
      return;
    }

    if (field === "intensity" && day.context.training === "none") return;
    if (day.context[field] === value) return;

    day.context[field] = value;
    if (field === "training" && value === "none") {
      day.context.intensity = "normal";
    }
    saveAndRender();
  }

  function handleQuickSearch(event) {
    if (event.type === "keydown" && event.key !== "Enter") return;
    if (event.type === "keydown") event.preventDefault();
    applyQuickFoodSearch();
  }

  function applyQuickFoodSearch() {
    const query = String(refs.quickSearch.value || "").trim();
    if (!query) return;

    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      refs.quickSearch.value = "";
      return;
    }

    const normalized = Nutrition.normalize(query);
    const food = sortFoods(activeFoods()).find((item) => {
      const names = [item.name, ...(item.aliases || [])].map(Nutrition.normalize);
      return names.some((name) => name === normalized || name.includes(normalized));
    });

    if (!food) {
      showToast("No encuentro ese alimento en la biblioteca.");
      return;
    }

    const day = currentDay();
    if (!day.meals.length) day.meals.push(createMeal("Comida 1"));
    const meal = day.meals[0];
    uiState.view = "diary";
    uiState.activeNav = "diary";
    uiState.addFoodMealIds.add(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.selectedFoodByMealId.set(meal.id, food.id);
    render();

    const mealElement = refs.meals.querySelector(`[data-meal-id="${CSS.escape(meal.id)}"]`);
    const selectElement = mealElement ? mealElement.querySelector("select[name='foodId']") : null;
    const gramsInput = mealElement ? mealElement.querySelector("input[name='grams']") : null;
    if (selectElement) selectElement.value = food.id;
    if (gramsInput) gramsInput.focus();
    if (mealElement) mealElement.scrollIntoView({ behavior: "smooth", block: "center" });
    refs.quickSearch.value = "";
  }

  function handleMealSubmit(event) {
    const form = event.target.closest("form[data-action='add-item']");
    if (!form) return;

    event.preventDefault();
    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }
    addItemFromForm(form);
  }

  function handleMealKeydown(event) {
    if (event.key !== "Enter") return;
    const field = event.target.closest("input[name='grams'], select[name='foodId']");
    if (!field) return;

    const form = field.closest("form[data-action='add-item']");
    if (!form) return;

    event.preventDefault();
    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }
    addItemFromForm(form);
  }

  function parseGramsValue(value) {
    const match = String(value || "")
      .replace(",", ".")
      .match(/\d+(?:\.\d+)?/);
    return match ? Nutrition.number(match[0]) : 0;
  }

  function addItemFromForm(form) {
    const mealId = form.dataset.mealId;
    const foodSelect = form.querySelector("select[name='foodId']");
    const gramsInput = form.querySelector("input[name='grams']");
    const foodId = foodSelect ? foodSelect.value : "";
    const grams = gramsInput ? parseGramsValue(gramsInput.value) : 0;
    const food = activeFoods().find((item) => item.id === foodId);

    if (!food || grams <= 0) {
      showToast("Selecciona una comida y añade el peso en gramos.");
      return;
    }

    const meal = currentDay().meals.find((item) => item.id === mealId);
    if (!meal) return;

    const item = addFoodToMeal(meal, food, grams);

    uiState.recommendationFocus = {
      mealId: meal.id,
      itemId: item.id,
      foodId: item.foodId
    };
    uiState.comboContext = null;
    uiState.selectedFoodByMealId.delete(meal.id);
    gramsInput.value = "";
    if (foodSelect) foodSelect.focus();
    saveAndRender(`${formatMacro(grams)}g ${food.name} añadido.`);
  }

  function addFoodToMeal(meal, food, grams) {
    const item = DiagnosisActions.addFoodToMeal(meal, food, grams, () => Storage.uid("item"));
    uiState.addFoodMealIds.add(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    return item;
  }

  function targetMealForSuggestion(day) {
    return DiagnosisActions.targetMealForSuggestion(day, createMeal);
  }

  function addDiagnosisSuggestion(foodId, gramsValue) {
    const day = currentDay();
    if (day.savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return false;
    }

    const food = activeFoods().find((item) => item.id === foodId);
    const grams = parseGramsValue(gramsValue);
    if (!food || grams <= 0) {
      showToast("Esa sugerencia ya no está disponible.");
      return false;
    }

    const { meal, createdMeal } = targetMealForSuggestion(day);
    const item = addFoodToMeal(meal, food, grams);
    uiState.recommendationFocus = {
      mealId: meal.id,
      itemId: item.id,
      foodId: item.foodId
    };
    uiState.comboContext = null;
    saveAndRender();
    setPendingUndo({
      id: Storage.uid("undo"),
      type: "diagnostic-add-item",
      date: state.selectedDate,
      payload: {
        mealId: meal.id,
        itemId: item.id,
        createdMeal
      },
      successMessage: "Sugerencia retirada.",
      failureMessage: "No se pudo deshacer porque el alimento ya cambió."
    }, `Sugerencia añadida a ${meal.name}.`);
    return true;
  }

  function saveMealTemplate(meal) {
    const items = mealTemplateItemsFromMeal(meal);
    if (!items.length) {
      showToast("Añade alimentos antes de guardar la comida.");
      return;
    }

    const now = new Date().toISOString();
    const name = String(meal.name || "").trim() || "Comida guardada";
    const existing = findMealTemplateBySignature(items);
    const itemSnapshots = buildMealTemplateSnapshots(items);

    if (existing) {
      existing.name = name;
      existing.items = items;
      existing.itemSnapshots = itemSnapshots;
      existing.updatedAt = now;
      saveAndRender("Comida guardada actualizada.");
      return;
    }

    state.mealTemplates = [
      {
        id: Storage.uid("meal-template"),
        name,
        items,
        itemSnapshots,
        createdAt: now,
        updatedAt: now
      },
      ...(state.mealTemplates || [])
    ];
    saveAndRender("Comida guardada.");
  }

  function mealTemplateById(templateId) {
    return (state.mealTemplates || []).find((template) => template.id === templateId);
  }

  function insertMealTemplate(templateId) {
    const template = mealTemplateById(templateId);
    if (!template) return;

    const items = cloneTemplateItems(template);
    if (!items.length) {
      showToast("Esa comida guardada no tiene alimentos.");
      return;
    }

    const day = currentDay();
    const emptyMeal = day.meals.find((meal) => !mealFoods(meal).length);
    const meal = emptyMeal || createMeal(template.name, true);
    meal.name = template.name;
    meal.manuallyAdded = true;
    setMealFoods(meal, items);

    if (!emptyMeal) day.meals.push(meal);

    uiState.view = "diary";
    uiState.activeNav = "diary";
    uiState.addFoodMealIds.delete(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.selectedFoodByMealId.delete(meal.id);
    saveAndRender(`${template.name} añadida.`);
  }

  function removeMealTemplate(templateId) {
    const template = mealTemplateById(templateId);
    if (!template) return;
    if (!confirmDanger(`Eliminar ${template.name} de comidas guardadas?`)) return;

    state.mealTemplates = (state.mealTemplates || []).filter((item) => item.id !== templateId);
    saveAndRender("Comida guardada eliminada.");
  }

  function handleMealsClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const readOnlyActions = new Set([
      "add-food",
      "add-food-combo",
      "add-meal",
      "add-frequent-food",
      "insert-meal-template",
      "remove-item",
      "remove-meal",
      "remove-meal-template",
      "save-meal-template",
      "toggle-add-food"
    ]);

    if (currentDay().savedAt && readOnlyActions.has(button.dataset.action)) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }

    const templateElement = event.target.closest("[data-template-id]");
    const templateId = templateElement ? templateElement.dataset.templateId : "";

    if (button.dataset.action === "insert-meal-template") {
      insertMealTemplate(templateId);
      return;
    }

    if (button.dataset.action === "remove-meal-template") {
      removeMealTemplate(templateId);
      return;
    }

    if (button.dataset.action === "add-frequent-food") {
      const day = currentDay();
      const food = activeFoods().find((item) => item.id === button.dataset.foodId);
      const grams = parseGramsValue(button.dataset.grams);
      if (!food || grams <= 0) return;

      const meal = targetMealForFrequentFood(day);
      const item = addFoodToMeal(meal, food, grams);
      uiState.recommendationFocus = {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      uiState.comboContext = null;
      uiState.addFoodMealIds.delete(meal.id);
      saveAndRender(`${food.name} añadido a ${meal.name}.`);
      return;
    }

    if (button.dataset.action === "add-meal") {
      addMeal();
      return;
    }

    if (button.dataset.action === "add-food") {
      const form = button.closest("form[data-action='add-item']");
      if (!form) return;
      addItemFromForm(form);
      return;
    }

    const mealElement = event.target.closest("[data-meal-id]");
    const mealId = mealElement ? mealElement.dataset.mealId : "";
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === mealId);

    if (button.dataset.action === "show-food-combos" && meal) {
      const itemId = button.dataset.itemId || event.target.closest("[data-item-id]")?.dataset.itemId || "";
      const item = mealFoods(meal).find((mealItem) => mealItem.id === itemId);
      if (!item) return;

      const sameContext = uiState.comboContext
        && uiState.comboContext.mealId === meal.id
        && uiState.comboContext.itemId === item.id
        && uiState.comboContext.foodId === item.foodId;

      uiState.comboContext = sameContext ? null : {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      uiState.recommendationFocus = sameContext ? null : {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      renderMeals(getRenderContext());
      return;
    }

    if (button.dataset.action === "add-food-combo" && meal) {
      const food = activeFoods().find((item) => item.id === button.dataset.foodId);
      const grams = parseGramsValue(button.dataset.grams);
      if (!food || grams <= 0) {
        showToast("Esa combinaciÃ³n ya no estÃ¡ disponible.");
        return;
      }

      const item = addFoodToMeal(meal, food, grams);
      if (button.dataset.sourceContext === "selected-food") {
        uiState.recommendationFocus = {
          mealId: meal.id,
          itemId: item.id,
          foodId: item.foodId
        };
        uiState.selectedFoodByMealId.set(meal.id, button.dataset.sourceFoodId || "");
        uiState.addFoodMealIds.add(meal.id);
        uiState.comboContext = null;
      } else {
        const sourceItem = mealFoods(meal).find((mealItem) => mealItem.id === button.dataset.sourceItemId) || item;
        uiState.recommendationFocus = {
          mealId: meal.id,
          itemId: sourceItem.id,
          foodId: sourceItem.foodId
        };
        uiState.comboContext = {
          mealId: meal.id,
          itemId: sourceItem.id,
          foodId: sourceItem.foodId
        };
      }
      saveAndRender(`${food.name} aÃ±adido a ${meal.name}.`);
      return;
    }

    if (button.dataset.action === "save-meal-template" && meal) {
      saveMealTemplate(meal);
      return;
    }

    if (button.dataset.action === "toggle-meal" && meal) {
      if (uiState.collapsedMealIds.has(mealId)) {
        uiState.collapsedMealIds.delete(mealId);
      } else {
        uiState.collapsedMealIds.add(mealId);
      }
      renderMeals(getRenderContext());
      return;
    }

    if (button.dataset.action === "toggle-add-food" && meal) {
      uiState.addFoodMealIds.add(mealId);
      renderMeals(getRenderContext());
      return;
    }

    if (button.dataset.action === "remove-item" && meal) {
      const itemId = event.target.closest("[data-item-id]").dataset.itemId;
      const items = mealFoods(meal);
      const itemIndex = items.findIndex((item) => item.id === itemId);
      if (itemIndex < 0) return;

      const removedItem = cloneValue(items[itemIndex]);
      setMealFoods(meal, items.filter((item) => item.id !== itemId));
      if (uiState.comboContext?.mealId === mealId && uiState.comboContext?.itemId === itemId) {
        uiState.comboContext = null;
      }
      if (uiState.recommendationFocus?.mealId === mealId && uiState.recommendationFocus?.itemId === itemId) {
        uiState.recommendationFocus = null;
      }
      saveAndRender();
      setPendingUndo({
        id: Storage.uid("undo"),
        type: "remove-item",
        date: state.selectedDate,
        payload: {
          mealId,
          itemIndex,
          item: removedItem
        }
      }, "Alimento retirado.");
    }

    if (button.dataset.action === "remove-meal" && meal) {
      if (day.meals.length <= 1) {
        const items = mealFoods(meal);
        if (!items.length) {
          uiState.addFoodMealIds.delete(mealId);
          uiState.collapsedMealIds.delete(mealId);
          uiState.selectedFoodByMealId.delete(mealId);
          uiState.comboContext = null;
          uiState.recommendationFocus = null;
          saveAndRender("Comida vacía y lista.");
          return;
        }

        if (!confirmDanger(`Vaciar ${meal.name}?`)) return;

        const removedItems = cloneValue(items);
        setMealFoods(meal, []);
        uiState.addFoodMealIds.delete(mealId);
        uiState.collapsedMealIds.delete(mealId);
        uiState.selectedFoodByMealId.delete(mealId);
        if (uiState.comboContext?.mealId === mealId) {
          uiState.comboContext = null;
        }
        if (uiState.recommendationFocus?.mealId === mealId) {
          uiState.recommendationFocus = null;
        }
        saveAndRender();
        setPendingUndo({
          id: Storage.uid("undo"),
          type: "clear-meal",
          date: state.selectedDate,
          payload: {
            mealId,
            items: removedItems
          },
          successMessage: "Comida recuperada.",
          failureMessage: "No se pudo deshacer porque la comida ya cambió."
        }, "Comida vaciada.");
        return;
      }
      if (mealFoods(meal).length && !confirmDanger(`Eliminar ${meal.name}?`)) return;
      const mealIndex = day.meals.findIndex((item) => item.id === mealId);
      if (mealIndex < 0) return;
      const removedMeal = cloneValue(meal);
      day.meals = day.meals.filter((item) => item.id !== mealId);
      uiState.addFoodMealIds.delete(mealId);
      uiState.collapsedMealIds.delete(mealId);
      uiState.selectedFoodByMealId.delete(mealId);
      if (uiState.recommendationFocus?.mealId === mealId) {
        uiState.recommendationFocus = null;
      }
      saveAndRender();
      setPendingUndo({
        id: Storage.uid("undo"),
        type: "remove-meal",
        date: state.selectedDate,
        payload: {
          mealIndex,
          meal: removedMeal
        }
      }, "Comida eliminada.");
    }
  }

  function handleSummaryClick(event) {
    const button = event.target.closest("button[data-action='add-diagnosis-suggestion']");
    if (!button) return;

    button.disabled = true;
    button.textContent = "Añadiendo...";
    if (!addDiagnosisSuggestion(button.dataset.foodId, button.dataset.grams)) {
      button.disabled = false;
      button.textContent = "Añadir";
    }
  }

  function handleMealChange(event) {
    const foodSelect = event.target.closest("select[name='foodId']");
    if (foodSelect) {
      const mealElement = event.target.closest("[data-meal-id]");
      const mealId = mealElement ? mealElement.dataset.mealId : "";
      if (!mealId) return;

      if (currentDay().savedAt) {
        showToast("Los dÃ­as guardados son de solo lectura.");
        renderMeals(getRenderContext());
        return;
      }

      if (foodSelect.value) {
        uiState.selectedFoodByMealId.set(mealId, foodSelect.value);
        uiState.recommendationFocus = null;
      } else {
        uiState.selectedFoodByMealId.delete(mealId);
        uiState.recommendationFocus = null;
      }
      renderMeals(getRenderContext());
      return;
    }

    const input = event.target.closest("[data-action='rename-meal']");
    if (!input) return;

    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      renderMeals(getRenderContext());
      return;
    }

    const mealId = event.target.closest("[data-meal-id]").dataset.mealId;
    const meal = currentDay().meals.find((item) => item.id === mealId);
    if (!meal) return;
    meal.name = input.value.trim() || "Comida";
    saveAndRender();
  }

  function handleLibraryInput(event) {
    if (event.target.name !== "foodSearch") return;
    uiState.foodSearch = event.target.value;
    const list = refs.libraryPanel.querySelector(".food-card-list");
    if (list) list.innerHTML = renderManagedFoodList();
  }

  function handleLibraryClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const card = button.closest("[data-food-id]");
    const foodId = card ? card.dataset.foodId : "";
    const food = state.foods.find((item) => item.id === foodId);

    if (button.dataset.action === "toggle-favorite" && food) {
      food.favorite = !food.favorite;
      saveAndRender(food.favorite ? "Favorito añadido." : "Favorito quitado.");
      return;
    }

    if (button.dataset.action === "edit-food" && food) {
      uiState.editingFoodId = food.id;
      renderFoodManager();
      return;
    }

    if (button.dataset.action === "cancel-edit-food") {
      uiState.editingFoodId = "";
      renderFoodManager();
      return;
    }

    if (button.dataset.action === "delete-food" && food) {
      if (!confirmDanger(`Eliminar ${food.name} de la biblioteca?`)) return;
      food.deletedAt = new Date().toISOString();
      if (uiState.editingFoodId === food.id) uiState.editingFoodId = "";
      saveAndRender("Alimento ocultado de la biblioteca.");
    }
  }

  function handleLibrarySubmit(event) {
    const form = event.target.closest("form.library-form");
    if (!form) return;

    event.preventDefault();
    const foodData = readFoodForm(form);
    if (!foodData) return;

    if (form.dataset.action === "create-food") {
      createOrReactivateFood(foodData, form);
      return;
    }

    if (form.dataset.action === "update-food") {
      updateFood(form.dataset.foodId, foodData);
    }
  }

  function readFoodForm(form) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const requiredNumeric = ["kcal", "protein", "carbs", "fat"];

    if (!name) {
      showToast("Añade un nombre para el alimento.");
      return null;
    }

    if (requiredNumeric.some((key) => String(data.get(key) || "").trim() === "")) {
      showToast("Completa kcal, proteína, carbohidratos y grasas.");
      return null;
    }

    const food = {
      name,
      aliases: [name],
      kcal: Nutrition.number(data.get("kcal")),
      protein: Nutrition.number(data.get("protein")),
      carbs: Nutrition.number(data.get("carbs")),
      fat: Nutrition.number(data.get("fat")),
      fiber: Nutrition.number(data.get("fiber")),
      servingLabel: String(data.get("servingLabel") || "").trim() || "ración",
      servingGrams: Math.max(Nutrition.number(data.get("servingGrams"), 100), 1),
      deletedAt: ""
    };

    if ([food.kcal, food.protein, food.carbs, food.fat, food.fiber].some((value) => value < 0)) {
      showToast("Los valores nutricionales no pueden ser negativos.");
      return null;
    }

    return food;
  }

  function createOrReactivateFood(foodData, form) {
    const conflict = findFoodByNameValue(foodData.name, { onlyActive: true });
    if (conflict) {
      showToast("Ese alimento ya existe en la biblioteca.");
      return;
    }

    const deletedMatch = findFoodByNameValue(foodData.name, { onlyDeleted: true });
    if (deletedMatch) {
      Object.assign(deletedMatch, foodData, {
        favorite: Boolean(deletedMatch.favorite),
        deletedAt: ""
      });
      form.reset();
      saveAndRender("Alimento reactivado.");
      return;
    }

    state.foods.push({
      id: `custom-${Nutrition.normalize(foodData.name).replace(/[^a-z0-9]+/g, "-")}-${Storage.uid("food")}`,
      favorite: false,
      ...foodData
    });

    form.reset();
    saveAndRender("Alimento guardado.");
  }

  function updateFood(foodId, foodData) {
    const food = state.foods.find((item) => item.id === foodId);
    if (!food) return;

    const conflict = findFoodByNameValue(foodData.name, { onlyActive: true, excludeId: foodId });
    if (conflict) {
      showToast("Ese nombre ya lo usa otro alimento.");
      return;
    }

    Object.assign(food, foodData, {
      favorite: Boolean(food.favorite),
      deletedAt: ""
    });
    uiState.editingFoodId = "";
    saveAndRender("Alimento actualizado.");
  }

  function findFoodByNameValue(name, options = {}) {
    const normalized = Nutrition.normalize(name);
    return state.foods.find((food) => {
      if (options.excludeId && food.id === options.excludeId) return false;
      if (options.onlyActive && food.deletedAt) return false;
      if (options.onlyDeleted && !food.deletedAt) return false;
      return Nutrition.normalize(food.name) === normalized;
    });
  }

  function repeatTargetDate() {
    const selectedDay = state.days[state.selectedDate];
    if (selectedDay && !selectedDay.savedAt) return state.selectedDate;

    const activeDate = Storage.activeDayIso();
    const activeDay = state.days[activeDate];
    if (!activeDay || !activeDay.savedAt) return activeDate;

    return nextCleanDateAfter(activeDate);
  }

  function editableDayForDate(date) {
    if (!state.days[date]) {
      state.days[date] = Storage.createDay(date, Data.DEFAULT_MEALS);
    }
    state.days[date].date = state.days[date].date || date;
    normalizeDay(state.days[date]);
    return state.days[date];
  }

  function repeatSavedDay(date) {
    const sourceDay = state.days[date];
    if (!sourceDay || !sourceDay.savedAt) {
      showToast("Ese día no está guardado.");
      return;
    }

    const { meals, fallbackCount } = cloneSavedDayMealsForActiveDay(sourceDay);
    if (!meals.length) {
      showToast("Ese día no tiene comidas para repetir.");
      return;
    }

    const targetDate = repeatTargetDate();
    const targetDay = editableDayForDate(targetDate);
    if (targetDay.savedAt) {
      showToast("Abre un día editable para repetir comidas.");
      return;
    }

    const targetHadContent = dayHasContent(targetDay);
    targetDay.meals = targetHadContent
      ? [...targetDay.meals, ...meals]
      : meals;

    state.selectedDate = targetDate;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();

    const message = fallbackCount
      ? "Día repetido con datos guardados disponibles."
      : targetHadContent ? "Comidas añadidas al día actual." : "Día repetido en el diario actual.";
    saveAndRender(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleHistoryClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "load-day") {
      clearPendingUndo({ hideToast: true });
      state.selectedDate = button.dataset.date;
      saveAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.action === "repeat-day") {
      repeatSavedDay(button.dataset.date);
    }
  }

  function resetDayUiState() {
    uiState.addFoodMealIds.clear();
    uiState.collapsedMealIds.clear();
    uiState.selectedFoodByMealId.clear();
    uiState.comboContext = null;
    uiState.recommendationFocus = null;
    clearPendingUndo({ hideToast: true });
    refs.quickSearch.value = "";
  }

  function cloneDayForDate(day, date) {
    const clone = JSON.parse(JSON.stringify(day));
    clone.date = date;
    normalizeDay(clone);
    return clone;
  }

  function moveSelectedDayToDate(targetDate) {
    const sourceDate = state.selectedDate;
    if (sourceDate === targetDate) return true;

    if (!dayCanBeReplaced(targetDate)) {
      showToast(`${formatDate(targetDate)} ya tiene datos.`);
      return false;
    }

    const sourceDay = currentDay();
    state.days[targetDate] = cloneDayForDate(sourceDay, targetDate);
    state.days[sourceDate] = Storage.createDay(sourceDate, Data.DEFAULT_MEALS);
    resetDayUiState();
    return true;
  }

  function usePreviousDay() {
    const previousDate = Storage.addDaysIso(state.selectedDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = previousDate;
    saveAndRender(`Registro movido a ${formatDate(previousDate)}.`);
  }

  function moveRegisteredDayToPrevious() {
    const sourceDate = state.selectedDate;
    const previousDate = Storage.addDaysIso(sourceDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = sourceDate;
    saveAndRender(`Día movido a ${formatDate(previousDate)}. Hoy queda limpio.`);
  }

  function registerPreviousDay() {
    const previousDate = Storage.addDaysIso(state.selectedDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = previousDate;
    registerDay();
  }

  function recoverLastClosedDay() {
    if (!hasRecoverableClosedDay()) {
      showToast("No hay un día cerrado para recuperar.");
      return;
    }

    const day = currentDay();
    if (day.savedAt) {
      showToast("Abre un día editable para recuperar comidas.");
      return;
    }

    const meals = cloneRecoveryMeals(state.lastClosedDayRecovery);
    if (!meals.length) {
      state.lastClosedDayRecovery = null;
      saveAndRender("No hay comidas que recuperar.");
      return;
    }

    const targetHadContent = dayHasContent(day);
    day.savedAt = "";
    delete day.nutritionSnapshot;
    day.meals = targetHadContent
      ? [...day.meals, ...meals]
      : meals;

    state.lastClosedDayRecovery = null;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();
    saveAndRender(targetHadContent
      ? "Último día cerrado añadido como copia editable."
      : "Último día cerrado recuperado como copia editable.");
  }

  function registerDay() {
    const day = currentDay();
    if (day.savedAt) {
      showToast("Este día ya está guardado en el historial.");
      return;
    }

    if (!dayHasLoggedFood(day)) {
      showToast("No hay comidas que guardar.");
      return;
    }

    day.savedAt = new Date().toISOString();
    day.nutritionSnapshot = buildNutritionSnapshot(day);
    state.lastClosedDayRecovery = buildLastClosedDayRecovery(day);

    const nextDate = nextCleanDateAfter(day.date);
    state.days[nextDate] = Storage.createDay(nextDate, Data.DEFAULT_MEALS);

    state.selectedDate = nextDate;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();
    saveAndRender(`Día guardado: ${formatDate(day.date)}. ${formatDate(nextDate)} queda limpio.`);
  }

  function addMeal() {
    const day = currentDay();
    const meal = createMeal(`Comida ${day.meals.length + 1}`, true);
    day.meals.push(meal);
    uiState.addFoodMealIds.add(meal.id);
    saveAndRender("Comida añadida.");
  }

  function changeDate(event) {
    clearPendingUndo({ hideToast: true });
    state.selectedDate = event.target.value || Storage.activeDayIso();
    currentDay();
    saveAndRender();
  }

  function handleDayContextClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "set-day-context") {
      setDayContextOption(button.dataset.field, button.dataset.value);
      return;
    }

    if (button.dataset.action === "use-previous-day") {
      usePreviousDay();
      return;
    }

    if (button.dataset.action === "register-previous-day") {
      registerPreviousDay();
      return;
    }

    if (button.dataset.action === "move-to-previous-day") {
      moveRegisteredDayToPrevious();
      return;
    }

    if (button.dataset.action === "recover-last-closed-day") {
      recoverLastClosedDay();
    }
  }

  if (typeof window.__LEFT_EAT_COMBINATION_TEST__ === "function") {
    window.__LEFT_EAT_COMBINATION_TEST__({
      foodCategory,
      recommendationIds(sourceFoodId, mealItems = []) {
        const sourceFood = activeFoods().find((food) => food.id === sourceFoodId);
        if (!sourceFood) return [];

        return foodCombinationRecommendations(sourceFood, {
          id: "test-meal",
          name: "Comida test",
          items: mealItems
        }, 4).map((item) => item.food.id);
      },
      contextualPanelHtml(sourceFoodId, mealItems = [], options = {}) {
        const sourceFood = activeFoods().find((food) => food.id === sourceFoodId);
        if (!sourceFood) return "";

        const meal = {
          id: "test-meal",
          name: "Comida test",
          items: mealItems
        };
        uiState.addFoodMealIds.clear();
        uiState.collapsedMealIds.clear();
        uiState.selectedFoodByMealId.clear();
        uiState.comboContext = null;
        uiState.recommendationFocus = null;

        if (options.mode === "selected") {
          uiState.addFoodMealIds.add(meal.id);
          uiState.selectedFoodByMealId.set(meal.id, sourceFood.id);
        } else {
          const sourceItem = meal.items.find((item) => item.foodId === sourceFood.id) || {
            id: "source-item",
            foodId: sourceFood.id,
            grams: Nutrition.number(sourceFood.servingGrams) || 100
          };
          if (!meal.items.some((item) => item.id === sourceItem.id)) meal.items.push(sourceItem);
          uiState.recommendationFocus = {
            mealId: meal.id,
            itemId: sourceItem.id,
            foodId: sourceFood.id
          };
        }

        return renderSmartFoodSuggestions({ meals: [meal] });
      }
    });
    return;
  }

  refs.profilePanelContent.addEventListener("click", handleProfileClick);
  refs.profileEditor.addEventListener("click", handleProfileEditorClick);
  refs.profileEditor.addEventListener("change", handleProfileEditorChange);
  refs.profileEditor.addEventListener("submit", handleProfileEditorSubmit);
  refs.sideNav.addEventListener("click", handleSideNavClick);
  refs.quickSearch.addEventListener("change", handleQuickSearch);
  refs.quickSearch.addEventListener("keydown", handleQuickSearch);
  refs.dayContext.addEventListener("click", handleDayContextClick);
  refs.dayContext.addEventListener("change", handleDayContextChange);
  refs.meals.addEventListener("submit", handleMealSubmit);
  refs.meals.addEventListener("keydown", handleMealKeydown);
  refs.meals.addEventListener("click", handleMealsClick);
  refs.meals.addEventListener("change", handleMealChange);
  refs.macroSummary.addEventListener("click", handleSummaryClick);
  refs.libraryPanel.addEventListener("click", handleLibraryClick);
  refs.libraryPanel.addEventListener("input", handleLibraryInput);
  refs.libraryPanel.addEventListener("submit", handleLibrarySubmit);
  refs.history.addEventListener("click", handleHistoryClick);
  refs.saveDay.addEventListener("click", registerDay);
  refs.date.addEventListener("change", changeDate);

  initializeSelectedDate();
  saveAndRender();
})();
