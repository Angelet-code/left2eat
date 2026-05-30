(function () {
  const Nutrition = window.LeftEatNutrition;
  const Icons = window.LeftEatIcons;

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

  function formatMacro(value, precision = 0) {
    return Nutrition.formatNumber(value, precision);
  }

  function icon(name) {
    return Icons.icon(name);
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

  function sortFoods(foods) {
    return [...foods].sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
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


  function activeFoodList(foods = []) {
    return (Array.isArray(foods) ? foods : []).filter((food) => food && !food.deletedAt);
  }

  function hasProfileAvatar(avatarId) {
    return Boolean(PROFILE_PIXEL_SPRITES[String(avatarId || '')]);
  }

  window.LeftEatRenderUtils = {
    activeFoodList,
    dayToneClass,
    dominantMacro,
    donutStyle,
    escapeHtml,
    fallbackFoodSpriteKey,
    foodSpriteKey,
    formatDate,
    formatDateTime,
    formatMacro,
    formatWithUnit,
    hasProfileAvatar,
    icon,
    macroToneClass,
    macroToneLabel,
    optionLabel,
    profileAvatarId,
    profileAvatarLabel,
    renderAvatarPicker,
    renderFoodSprite,
    renderProfileSprite,
    selected,
    sortFoods
  };
})();
