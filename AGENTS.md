# AGENTS.md

## Proyecto

Left2Eat es una app web local en HTML, CSS y JavaScript plano para registrar alimentacion diaria, calcular macros y guardar historial. No usa React, bundler ni dependencias.

URL habitual de desarrollo:

```bash
node dev-server.mjs
```

Servidor por defecto: `http://127.0.0.1:5174/index.html`.

## Estructura

- `index.html`: markup principal y orden de carga de scripts.
- `src/data.js`: alimentos base, objetivos, niveles de actividad y equivalencias.
- `src/storage.js`: persistencia en `localStorage`.
- `src/nutrition.js`: calculos nutricionales, resumen diario, rangos, equivalencias y recomendaciones.
- `src/icons.js`: iconos SVG inline.
- `src/app.js`: estado UI, renderizado, eventos y persistencia.
- `src/styles.css`: sistema visual y responsive.

## Modelo De Dominio

La estructura conceptual es:

1. Dia
2. Comidas
3. Alimentos dentro de cada comida

Importante: por compatibilidad, el estado guardado mantiene los alimentos de cada comida en `meal.items`. El codigo ya acepta `meal.foods` como alias semantico en nutricion, pero no se debe cambiar el formato persistido sin migracion explicita.

Clave de persistencia que no debe cambiarse:

```txt
left-eat-state-v1
```

## Reglas De Trabajo

- Mantener la app en vanilla HTML/CSS/JS.
- No introducir framework, Tailwind, bundler ni dependencias salvo peticion explicita.
- Preservar datos ya guardados en `localStorage`.
- Evitar cambios visuales grandes cuando la tarea sea limpieza o refactor.
- Usar `Nutrition.summarizeDay(day, profile, foods)` como fuente principal de datos del render del diario.
- Mantener `src/app.js` como orquestador, no como sitio para duplicar calculos nutricionales.
- Si se toca frontend, verificar en navegador local y revisar consola.

## Validacion

Ejecutar antes de cerrar cambios:

```bash
node --check src/data.js
node --check src/storage.js
node --check src/nutrition.js
node --check src/icons.js
node --check src/app.js
```

Checks manuales recomendados:

- Cargar diario sin errores de consola.
- Anadir y quitar alimento de una comida.
- Anadir y quitar comida.
- Cambiar entreno, intensidad y pasos del dia.
- Editar perfil.
- Abrir `Alimentos` desde navegacion y volver a `Diario`.
- Comprobar responsive sin overflow horizontal en desktop estrecho y movil.

## Estado Actual Del Producto

- El diario esta redisenado con sidebar, hero oscuro, macro cards, comidas colapsables y panel derecho.
- La biblioteca de alimentos permite crear, editar, marcar favorito y ocultar alimentos.
- Las macros usan paleta estable:
  - kcal: azul
  - proteina: verde
  - carbohidratos: ambar
  - grasas: rojo intenso
  - fibra: violeta
- Los objetivos se muestran como rango aceptable y optimo, no como numero unico obligatorio.
- La estructura tecnica fue limpiada para que nutricion concentre calculos y app renderice desde contexto.

## Cuidado Especial

- No borrar ni renombrar `meal.items` sin migracion.
- No cambiar `left-eat-state-v1`.
- No usar `window.confirm` directamente; usar `confirmDanger(message)`.
- Al eliminar comidas vacias no hace falta confirmacion; si tienen alimentos, si.
- El texto visible esta en castellano.
