(function () {
  const Data = window.LeftEatData;
  const Utils = window.LeftEatRenderUtils;

  const {
    escapeHtml,
    optionLabel,
    profileAvatarId,
    profileAvatarLabel,
    renderAvatarPicker,
    renderProfileSprite,
    selected
  } = Utils;

  function profileName(profile) {
    return String(profile?.profileName || "").trim() || "Mi perfil";
  }

  function renderSidebarProfile({ profile, isEditing = false }) {
    const name = profileName(profile);
    const goal = optionLabel(Data.GOALS, profile.goal);
    const activity = optionLabel(Data.ACTIVITY_LEVELS, profile.activity);
    const avatarId = profileAvatarId(profile);

    return {
      title: name,
      html: `
      <div class="profile-summary">
        <div class="profile-identity">
          <span class="profile-avatar profile-avatar-${escapeHtml(avatarId)}" aria-hidden="true">${renderProfileSprite(avatarId)}</span>
          <div>
            <strong>${escapeHtml(name)}</strong>
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
        <button class="quiet-action" type="button" data-action="edit-profile">${isEditing ? "Editando perfil" : "Editar perfil"}</button>
      </div>
    `
    };
  }

  function renderProfileEditor({ profile }) {
    const name = profileName(profile);
    const avatarId = profileAvatarId(profile);

    return `
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
              <input name="profileName" type="text" maxlength="40" value="${escapeHtml(name)}">
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

  window.LeftEatProfileRenderers = {
    renderProfileEditor,
    renderSidebarProfile
  };
})();
