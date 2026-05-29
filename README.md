# Left2Eat

App web local para registrar comidas diarias, calcular macros en tiempo real y guardar historico para analisis posterior.

## Estructura

- `index.html`: pantalla principal de la app y carga ordenada de modulos.
- `src/data.js`: alimentos base, objetivos, niveles de actividad y listas auxiliares.
- `src/storage.js`: estado persistente con `localStorage` usando la clave `left-eat-state-v1`.
- `src/nutrition.js`: calculo nutricional, resumen diario, rangos, equivalencias, recomendaciones y busqueda de alimentos.
- `src/icons.js`: iconos SVG inline reutilizables.
- `src/diagnosis-actions.js`: acciones puras del diagnostico para insertar sugerencias como items normales y validarlas sin navegador.
- `src/app.js`: orquestacion de estado UI, renderizado, eventos y persistencia.
- `src/styles.css`: layout responsive y sistema visual.
- `scripts/validate-project-structure.mjs`: validacion local de higiene estructural y artefactos generados.
- `scripts/report-css-structure.mjs`: inventario de capas y selectores CSS repetidos para planificar limpiezas acotadas.
- `scripts/validate-css-structure.mjs`: validacion local de contratos estructurales del CSS.
- `scripts/validate-food-combinations.mjs`: validacion local de recomendaciones por combinacion culinaria.
- `scripts/validate-diagnosis-flow.mjs`: validacion local del flujo de sugerencias y deshacer.
- `scripts/validate-storage-history-snapshots.mjs`: validacion local del contrato de storage, historial y snapshots.
- `scripts/validate-ui-contracts.mjs`: validacion local de contratos de UI que no deben volver a romperse.

## Modelo De Dominio

La estructura conceptual es:

1. Dia
2. Comidas del dia
3. Alimentos dentro de cada comida

Por compatibilidad con datos guardados, cada comida sigue persistiendo sus alimentos en la propiedad `items`. El codigo de nutricion ya acepta tambien `foods` como alias semantico para facilitar una migracion futura sin romper historico.

## Flujo De Uso

1. Ajustar perfil: altura, peso, edad, actividad media, objetivo, entrenos semanales y pasos habituales.
2. Indicar el contexto del dia: si hay entreno, intensidad y pasos reales.
3. Elegir el dia en el selector superior.
4. Anadir comidas seleccionando el alimento en el desplegable y escribiendo el peso en gramos.
5. Consultar el panel de macros: consumido, rango aceptable y objetivo optimo.
6. Usar equivalencias para ver cuanto faltaria en salmon, pollo, patatas, pan, etc.
7. Registrar el dia para que pase al historial y entre en la media reciente.

## Desarrollo

No hay framework, bundler ni dependencias nuevas. Para validar sintaxis:

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

## Proximas Mejoras Naturales

- Graficas de evolucion de peso y cumplimiento semanal.
- Importacion desde etiquetas nutricionales o codigo de barras.
- Plantillas de comidas frecuentes.
- Exportacion CSV del historico.
- Base de datos real en backend cuando deje de ser una app local.
