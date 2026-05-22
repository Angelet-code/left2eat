(function () {
  const icons = {
    pencil: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
      </svg>
    `,
    trash: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 6h18"></path>
        <path d="M8 6V4h8v2"></path>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
      </svg>
    `,
    star: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"></path>
      </svg>
    `,
    starFilled: `
      <svg class="button-icon is-filled" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"></path>
      </svg>
    `,
    chevron: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `,
    plus: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
    `,
    sparkles: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m12 3 1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9Z"></path>
        <path d="M19 15v4"></path>
        <path d="M17 17h4"></path>
      </svg>
    `,
    flame: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 22c4 0 7-3 7-7 0-3-1.5-5-4.5-8.5C13.8 9 12.3 10.2 10 11c.7-3.5-.8-6-3-8-1 4-4 6.5-4 11 0 4.5 3.5 8 9 8Z"></path>
      </svg>
    `,
    user: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 21c1.5-4 4.2-6 8-6s6.5 2 8 6"></path>
      </svg>
    `,
    protein: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 8c2-3 6-4 10-2 3 1.5 4 5 2 8-2.2 3.3-7.3 5.6-11 3-3.4-2.4-3.4-6-.9-9Z"></path>
        <path d="M9 10c2 1 4 1 6 0"></path>
      </svg>
    `,
    carbs: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 21V4"></path>
        <path d="M7 8c3 0 5 2 5 5-3 0-5-2-5-5Z"></path>
        <path d="M17 8c-3 0-5 2-5 5 3 0 5-2 5-5Z"></path>
        <path d="M7 14c3 0 5 2 5 5-3 0-5-2-5-5Z"></path>
        <path d="M17 14c-3 0-5 2-5 5 3 0 5-2 5-5Z"></path>
      </svg>
    `,
    fat: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3c4 4.2 7 7.7 7 11a7 7 0 0 1-14 0c0-3.3 3-6.8 7-11Z"></path>
      </svg>
    `,
    fiber: `
      <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z"></path>
        <path d="M5 19 19 5"></path>
      </svg>
    `
  };

  function icon(name) {
    return icons[name] || "";
  }

  window.LeftEatIcons = { icon };
})();
