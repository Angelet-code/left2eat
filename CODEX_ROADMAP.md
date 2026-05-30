# Hoja de ruta para mejora estructural de Left2Eat

Este documento convierte el diagnostico actual del proyecto en una hoja de ruta
implementable por otro agente. El objetivo no es redisenar la app ni cambiar el
producto visible, sino mejorar la ergonomia para Codex, reducir riesgo de
regresiones y ordenar la estructura tecnica manteniendo vanilla HTML/CSS/JS.

## Contexto operativo

- Proyecto local sin framework, bundler ni dependencias.
- Entrada habitual: `node dev-server.mjs`.
- URL local esperada: `http://127.0.0.1:5174/index.html`.
- Hay que preservar la clave de persistencia `left-eat-state-v1`.
- El formato persistido de comidas debe seguir usando `meal.items`.
- `meal.foods` solo puede tratarse como alias legacy de entrada; no debe
  persistirse.
- `src/app.js` debe ser orquestador de UI, eventos y persistencia.
- `src/nutrition.js` debe concentrar calculos nutricionales y resumen diario.
- La fuente principal del render del diario debe seguir siendo
  `Nutrition.summarizeDay(day, profile, foods)`.
- No introducir React, Tailwind, bundler ni dependencias.
- No hacer commits ni push salvo peticion explicita del usuario.

Antes de implementar cualquier fase, revisar cambios locales:

```bash
git -c safe.directory="A:/PROYECTOS/OPENCODE/Left Eat" status --short
```

Si existen cambios no hechos por el agente, no revertirlos. Trabajar alrededor
de ellos y mantener los diffs acotados.

## Validacion base obligatoria

Hasta que exista un script agregado de validacion, ejecutar:

```bash
node --check src/data.js
node --check src/storage.js
node --check src/nutrition.js
node --check src/icons.js
node --check src/diagnosis-actions.js
node --check src/app.js
node scripts/validate-project-structure.mjs
node scripts/validate-css-structure.mjs
node scripts/validate-ui-contracts.mjs
node scripts/validate-food-combinations.mjs
node scripts/validate-diagnosis-flow.mjs
node scripts/validate-storage-history-snapshots.mjs
```

Si se toca frontend, validar tambien en navegador local y revisar consola.
Checks manuales minimos:

- Cargar Diario sin errores de consola.
- Anadir y quitar alimento.
- Anadir y quitar comida.
- Cambiar entreno, intensidad y pasos.
- Editar perfil.
- Abrir Alimentos desde navegacion y volver a Diario.
- Revisar responsive en desktop estrecho y movil sin overflow horizontal.

## Fase 1: Ergonomia para Codex

Objetivo: reducir errores mecanicos y hacer que cada ciclo tenga una entrada de
validacion unica.

Cambios:

- Crear `scripts/validate-all.mjs`.
- El script debe ejecutar, en este orden, todos los `node --check` y validadores
  listados en la seccion de validacion base.
- Debe fallar con codigo distinto de cero si falla cualquier comando.
- Debe imprimir una linea clara por comando o por bloque validado.
- No debe instalar dependencias ni usar shell-specific tricks.
- Actualizar `README.md`, `AGENTS.md` y `TEAM_LOOP.md` para documentar
  `node scripts/validate-all.mjs` como comando principal.
- Mantener la lista expandida de comandos como referencia secundaria para
  depuracion.
- Anadir `.gitattributes` para fijar finales de linea:
  - `*.js text eol=lf`
  - `*.mjs text eol=lf`
  - `*.css text eol=lf`
  - `*.html text eol=lf`
  - `*.md text eol=lf`
- Anadir en `AGENTS.md` una ruta rapida para cambios pequenos:
  - leer contexto afectado,
  - tocar minimo,
  - ejecutar `node scripts/validate-all.mjs`,
  - usar `TEAM_LOOP.md` completo solo para ciclos autonomos de producto.

Criterios de aceptacion:

- `node scripts/validate-all.mjs` ejecuta toda la validacion base.
- La documentacion permite a otro agente saber cual es el comando recomendado.
- No cambia UI ni comportamiento persistido.
- No aparecen artefactos generados en raiz ni en `reports/`.

## Fase 2: Invariantes de dominio y persistencia

Objetivo: blindar `meal.items`, eliminar duplicacion pequena y corregir defectos
visibles de texto.

Cambios:

- Crear un helper compartido vanilla, por ejemplo `src/meal-items.js`.
- Cargarlo en `index.html` antes de `src/diagnosis-actions.js` y `src/app.js`.
- Exponer `window.LeftEatMealItems` con API minima:
  - `list(meal)`: devuelve `meal.foods` si existe como legacy, si no
    `meal.items`, y si no `[]`.
  - `ensure(meal)`: canonicaliza la comida a `meal.items`, borra `meal.foods` y
    devuelve `meal.items`.
  - `set(meal, items)`: asigna `meal.items = items`, borra `meal.foods` y
    devuelve `meal.items`.
- Cambiar `src/app.js` para usar `LeftEatMealItems` en vez de helpers locales
  duplicados para comidas.
- Cambiar `src/diagnosis-actions.js` para usar el mismo helper.
- Mantener `src/nutrition.js` tolerante a `meal.foods` para lectura legacy, pero
  no mutar estado desde nutricion.
- Reemplazar la copia local de `normalizeDayContext` en `src/app.js` por
  `Nutrition.normalizeDayContext`.
- Actualizar `scripts/validate-ui-contracts.mjs`, porque actualmente espera que
  `src/app.js` contenga `function normalizeDayContext`.
- Ampliar `scripts/validate-storage-history-snapshots.mjs` con un caso legacy:
  una comida con `foods` se carga o muta y, tras guardar, se persiste con
  `items` y sin `foods`.
- Corregir los strings con mojibake real en `src/app.js`:
  - `Los dias guardados son de solo lectura.`
  - `Esa combinacion ya no esta disponible.`
  - mensajes de `anadido`.

Criterios de aceptacion:

- Ningun flujo de mutacion puede persistir `meal.foods`.
- Los checks siguen protegiendo `left-eat-state-v1`.
- Los mensajes visibles dejan de mostrar caracteres corruptos.
- No se cambia el modelo persistido salvo canonicalizar entrada legacy a
  `meal.items`.

## Fase 3: Extraer recomendaciones y combinaciones

Objetivo: sacar logica culinaria y de ranking desde `src/app.js` sin cambiar la
experiencia visible.

Cambios:

- Crear `src/food-combinations.js`.
- Cargarlo en `index.html` antes de `src/app.js`.
- Mover ahi la logica pura relacionada con:
  - categoria de alimento,
  - reglas explicitas de combinacion,
  - incompatibilidad carne/pescado,
  - ranking semantico,
  - ranking por historial y plantillas,
  - cantidad preferida por alimento.
- Exponer una API pura, por ejemplo:

```js
window.LeftEatFoodCombinations = {
  foodCategory,
  recommend
};
```

- `recommend` debe recibir todos los datos necesarios como parametros, sin leer
  `state` global:

```js
recommend({
  sourceFood,
  meal,
  foods,
  days,
  mealTemplates,
  limit
});
```

- Mantener en `src/app.js` solo:
  - deteccion del contexto UI,
  - render de tarjetas,
  - eventos de click,
  - insercion de alimentos.
- Actualizar `scripts/validate-food-combinations.mjs` para probar
  `src/food-combinations.js` directamente.
- Retirar el hook interno `window.__LEFT_EAT_COMBINATION_TEST__` de `app.js` si
  el nuevo test ya no lo necesita.

Criterios de aceptacion:

- Las recomendaciones siguen dando los mismos resultados clave:
  - kefir/yogur ofrece fruta y crema de cacahuete cuando aplica,
  - salmon no sugiere carne,
  - pollo sugiere arroz/patata/verdura esperada,
  - una comida con carne no sugiere pescado ni otra carne como combinacion.
- `src/app.js` pierde logica culinaria y queda mas orientado a UI.
- `scripts/validate-food-combinations.mjs` no necesita cargar `src/app.js`.

## Fase 4: Adelgazar `src/app.js` por superficies

Objetivo: que `src/app.js` vuelva a ser un coordinador claro.

Orden recomendado:

1. Extraer render de perfil.
2. Extraer render de biblioteca de alimentos.
3. Extraer render de historial.
4. Extraer render del diario y comidas solo despues de estabilizar las fases
   anteriores.

Reglas:

- Mantener los listeners principales y la persistencia en `src/app.js`.
- Los renderizadores extraidos deben recibir datos por parametros.
- Evitar que los nuevos modulos lean o muten `state` directamente.
- Mantener `data-action` como contrato de eventos.
- No cambiar copy ni layout salvo necesidad tecnica puntual.
- No convertir los nuevos modulos a ES modules si eso obliga a cambiar el
  modelo de carga del proyecto; mantener IIFE y `window.LeftEat...`.

Criterios de aceptacion:

- Cada extraccion reduce `src/app.js` sin cambiar comportamiento.
- Los validadores existentes siguen pasando tras cada subfase.
- El flujo manual de diario, alimentos, perfil e historial funciona igual.

## Fase 5: Consolidacion CSS conservadora

Objetivo: reducir capas historicas en `src/styles.css` sin redisenar la app.

Preparacion:

```bash
node scripts/report-css-structure.mjs
```

Cambios:

- Reordenar CSS progresivamente en bloques estables:
  - tokens,
  - base,
  - layout,
  - componentes,
  - vistas,
  - responsive.
- Consolidar selectores repetidos especialmente:
  - `.workspace`
  - `.sidebar`
  - `.topbar`
  - `.summary-panel`
  - `.side-nav button`
  - `.profile-panel`
- Eliminar capas historicas solo cuando una captura o revision en navegador
  confirme que no cambia el resultado esperado.
- Actualizar `scripts/validate-css-structure.mjs` para proteger la nueva
  organizacion y evitar que vuelvan capas obsoletas.

Criterios de aceptacion:

- Menos secciones historicas y menos repeticion.
- La UI mantiene su identidad visual.
- No aparece overflow horizontal en desktop estrecho ni movil.
- Los contratos de `validate-ui-contracts.mjs` y `validate-css-structure.mjs`
  siguen pasando.

## Fase 6: Seguridad UX y QA visual

Objetivo: cerrar deuda de interaccion y hacer mas fiable la validacion frontend.

Cambios:

- Sustituir la implementacion interna de `confirmDanger(message)` por una
  confirmacion propia de la app.
- Mantener la firma `confirmDanger(message)` para no reescribir todos los
  llamadores en el primer paso.
- Conservar reglas actuales:
  - eliminar comida vacia no requiere confirmacion,
  - eliminar o vaciar comida con alimentos si requiere confirmacion,
  - deshacer debe seguir funcionando cuando aplique.
- Documentar en `TEAM_LOOP.md` una comprobacion visual minima para cambios de
  frontend:
  - abrir navegador local,
  - revisar consola,
  - probar flujo afectado,
  - revisar responsive.

Criterios de aceptacion:

- No queda uso directo de `window.confirm` fuera de una capa controlada, y si se
  elimina completamente, los tests/manual QA cubren confirmar y cancelar.
- Las acciones destructivas siguen siendo claras.
- El flujo de deshacer no pierde confianza.

## Orden global recomendado

1. Fase 1: reduce friccion para todos los cambios posteriores.
2. Fase 2: protege persistencia y elimina duplicacion de alto impacto.
3. Fase 3: saca dominio culinario de `src/app.js` con riesgo controlado.
4. Fase 4: adelgaza UI por superficies, una a una.
5. Fase 5: consolida CSS sin redisenar.
6. Fase 6: mejora confirmaciones y protocolo de QA visual.

No mezclar fases grandes. Si se quiere una primera entrega pequena y segura,
implementar solo:

- `scripts/validate-all.mjs`,
- `.gitattributes`,
- documentacion del comando unico,
- correccion de mojibake,
- test que impida persistir `meal.foods`.

## Riesgos y notas para el agente implementador

- `scripts/validate-ui-contracts.mjs` contiene asserts literales contra texto de
  `src/app.js`; al extraer funciones o cambiar strings, actualizar el contrato
  deliberadamente.
- `src/styles.css` tiene muchas capas aditivas. No limpiar CSS a ojo: usar
  `report-css-structure`, navegador local y cambios pequenos.
- Si Git muestra warnings de line endings, resolver con `.gitattributes` antes
  de grandes refactors para evitar diffs ruidosos.
- Si hay cambios locales previos en archivos tocados, leer el diff antes de
  editar y conservar el trabajo existente.
- No cambiar `left-eat-state-v1`.
- No renombrar ni eliminar `meal.items`.
- No persistir `meal.foods`.
