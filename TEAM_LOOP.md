# Left2Eat Team Loop

Este documento guarda el proceso de reuniones y ejecucion autonoma usado para avanzar Left2Eat. Sirve como protocolo reutilizable en futuros chats o automatizaciones.

## Objetivo

Avanzar el producto en ciclos cortos, exigentes y autonomos:

1. Hacer preflight del ciclo.
2. Convocar una reunion general de roles.
3. Revisar backlog vivo y elegir una unica tarea prioritaria.
4. Asignar un rol lider con mas peso de decision.
5. Hacer una reunion especifica de esa tarea.
6. Implementar un cambio acotado y reversible.
7. Validar contra la definicion de hecho.
8. Reportar decision, cambios, pruebas, riesgos y siguiente prioridad.
9. Repetir el ciclo.

La regla central es no pedir decisiones al usuario durante el ciclo. Si una decision es ambigua, elegir la opcion que proteja datos, compatibilidad y uso diario. Si algo es demasiado arriesgado, aparcarlo y avanzar con una alternativa segura.

## Roles

### Producto/UX

Responsable de:

- Flujo de usuario.
- Jerarquia de acciones.
- Claridad del copy visible.
- Alcance minimo viable de cada ciclo.
- Evitar complejidad innecesaria.

Tiene veto si la tarea hace la app mas confusa, ansiosa, lenta o dificil de usar.

### Dominio/Nutricion

Responsable de:

- Reglas nutricionales.
- Macros, rangos y recomendaciones.
- Alimentos, equivalencias, snapshots y plantillas.
- Evitar inferencias medicas o promesas no justificadas.

Tiene mas peso cuando la tarea afecta calculos, diagnostico, objetivos, alimentos o interpretacion nutricional.

### Persistencia/Estado

Responsable de:

- LocalStorage.
- Compatibilidad de datos.
- Historial.
- Migraciones.
- Recuperacion y seguridad ante perdida de datos.

Tiene veto si un cambio puede romper `left-eat-state-v1`, perder historial, mutar dias guardados o cambiar `meal.items` sin migracion explicita.

### Frontend/Interaccion

Responsable de:

- Renderizado.
- Feedback inmediato.
- Controles.
- Responsive.
- Accesibilidad practica.
- Integracion visual con el sistema existente.

Tiene mas peso cuando la tarea cambia la experiencia de interaccion o el layout.

### QA

Responsable de:

- Criterios de aceptacion.
- Regresiones.
- Riesgos.
- Pruebas manuales y estaticas.
- Bloqueos por perdida de confianza.

Tiene veto si un cambio deja dudas sobre historial, persistencia, consola, responsive o flujo principal.

## Aprendizajes Del Usuario

Estos aprendizajes vienen de los ciclos recientes de producto y deben influir en las decisiones autonomas. No son preferencias cosmeticas sueltas: son senales de como debe madurar Left2Eat.

### Principio Transversal: Fondo, No Forma

El equipo debe aprender el patron profundo detras de las decisiones del usuario, no copiar literalmente la forma concreta de cada ejemplo.

- Pixel art, Pokemon, tarjetas sugeridas, recomendaciones o aprendizaje del comportamiento son ejemplos de ideas transferidas desde otros dominios. No son mandatos permanentes ni garantias de que esa forma concreta sea siempre buena.
- Cuando el usuario trae una idea creativa, cada rol debe extraer: que problema resuelve, que emocion o claridad aporta, que comportamiento nuevo permite, que convencion rompe y como probarlo pequeno sin perder confianza.
- La pregunta correcta no es "que elemento copiamos", sino "que principio de producto hay debajo y como lo traducimos a Left2Eat".
- Una buena idea abre un camino nuevo, reduce friccion o aumenta claridad, encaja con el comportamiento real del usuario, puede probarse de forma acotada y no rompe datos ni confianza.
- Una idea puede ser valiosa aunque su primera forma visual sea mala. QA debe distinguir entre "la apuesta era mala" y "la ejecucion necesita otra traduccion".

### Producto/UX

- El usuario prefiere claridad operativa antes que densidad. Si una pantalla parece "antigua", "liosa" o "con mucho ruido", no hay que anadir mas paneles: hay que reducir jerarquia, ocultar detalles secundarios y hacer evidente la siguiente accion.
- No se deben desplegar formularios o controles avanzados por defecto. Crear, editar o configurar debe aparecer cuando el usuario lo pide.
- Los flujos grandes no deben vivir en espacios pequenos. Editar perfil, gestionar datos complejos o elegir avatares debe ocupar el area principal, no la sidebar.
- Las acciones destructivas o de cierre de flujo necesitan una salida clara: guardar y descartar deben ser botones visibles, grandes y sin ambiguedad.
- Producto/UX debe buscar analogias fuera de las apps de dieta: juegos, cuadernos, cocina real, compras, entrenamiento, habitos, mapas o colecciones. La analogia solo sirve si mejora el flujo diario.

### Frontend/Interaccion

- Referencias como "estilo Pokemon" significan buscar personalidad, lenguaje visual claro, estados reconocibles, barras legibles e iconografia con caracter; no significan copiar literalmente pokeballs, nombres como Equipo/Bolsa, ni convertir la app en un juego.
- La app debe tener personalidad, pero no a costa de legibilidad. Si la estetica pixel genera bordes, fondos o tarjetas dentro de tarjetas, hay que limpiar.
- Desktop no debe confundirse con movil solo porque una columna sea estrecha. La sidebar es una restriccion de layout de escritorio; no se debe meter ahi una UI pesada.
- Antes de cerrar un cambio visual, revisar especialmente: overflow horizontal, textos cortados, contraste, formularios desplegados, sidebar estable y scroll innecesario.
- Si algo se ve descuadrado, probar primero con menos fondo, menos borde, menos contenedor y mas aire antes de redisenar otra vez toda la pantalla.
- Frontend debe traducir la idea a un sistema propio de Left2Eat. Inspirarse no es calcar: la interfaz final debe sentirse coherente con nutricion, registro diario y uso repetido.

### Persistencia/Estado

- Ediciones largas deben usar un modelo mental de borrador: modificar en formulario, guardar explicitamente o descartar. Evitar persistir cada cambio si el usuario espera una sesion de edicion.
- Los cambios visuales no deben alterar `left-eat-state-v1`, `meal.items`, historial ni snapshots.
- Si se introduce una nueva preferencia, como avatar de perfil, debe ser compatible: valor opcional, fallback seguro y sin migracion irreversible.

### Dominio/Nutricion

- Las recomendaciones deben parecer humanas y contextualizadas. Si el usuario selecciona kefir, sugerir arandanos o platano; no sugerir salmon aunque cuadre numericamente.
- La app no debe mostrar macros por mostrar. El diagnostico y las sugerencias deben responder a "que hago ahora" antes que a "cuantos numeros puedo ver".
- Los alimentos frecuentes, favoritos y combinaciones deben reducir friccion de registro, no convertirse en otra capa de ruido.
- Dominio debe buscar sentido culinario y de habito, no solo optimizacion numerica. Una recomendacion correcta en macros puede ser mala si en la vida real no combina.

### QA

- La captura o feedback visual del usuario tiene prioridad sobre la suposicion del agente. Si el usuario dice "ahora mucho peor", el ciclo debe asumir regresion visual y corregir de forma conservadora.
- La validacion estatica no basta para cambios de UI. Si el navegador automatizado falla, el agente debe dejarlo claro, pero aun asi revisar el codigo contra sintomas concretos: `open` inesperado, fondos heredados, posicion fixed, grid demasiado ancho, overflow y estados visibles por defecto.
- QA debe vetar soluciones que tecnicamente funcionen pero rompan confianza visual: modales innecesarios, scroll horizontal, controles cortados, acciones que se guardan sin confirmacion conceptual o layouts que desplazan zonas estables.
- QA debe evaluar si se ha entendido el fondo de una idea. Si el cambio copia la forma pero no mejora claridad, friccion, personalidad o aprendizaje del usuario, debe marcarlo como fallo de producto.

## Gestion De Ideas Creativas

Left2Eat puede crecer con ideas fuertes transferidas desde otros ambitos: alimentos que se reconocen de un vistazo, registro que se aprende del habito, recomendaciones que parecen de cocina real, mapas mentales de progreso, colecciones, rutinas o cualquier otra metafora util. Pixel art, redisenos completos, combinaciones habituales, favoritos, recientes y aprendizaje del comportamiento son ejemplos posibles, no la receta.

Regla general: cada idea creativa debe tratarse como un experimento de producto, no como una decoracion que se aplica por inercia.

Antes de implementar una idea creativa, la reunion especifica debe responder:

- Hipotesis: que problema concreto resuelve para el usuario.
- Superficie: en que pantalla o flujo aparece.
- Alcance: cual es la version mas pequena que prueba la idea.
- Criterio de exito: como sabremos que mejora el uso diario.
- Criterio de retirada: que senal indica que hay que revertir o simplificar.
- Interaccion con lo existente: que no debe romper ni desplazar.
- Rol lider: quien tiene la ultima palabra si hay conflicto.
- Principio transferido: que aprendizaje profundo se esta tomando de la referencia externa.
- Traduccion propia: como se convierte en algo natural para Left2Eat sin copiar literalmente la referencia.

### Reglas Para Ideas Fuertes

- La idea debe apoyar el flujo, no competir con el. Si el usuario tarda mas en entender que hacer, la traduccion falla aunque la referencia sea buena.
- Las apuestas nuevas deben empezar por superficies pequenas: un flujo, una tarjeta, una recomendacion, un estado, una accion o una pantalla concreta. No rehacer toda la app sin estabilizar antes navegacion, formularios y layout.
- Un rediseño completo requiere primero fijar una base: sidebar estable, contenido principal claro, panel derecho legible, formularios sin overflow y acciones principales visibles.
- Si aparece una captura donde el estado anterior era mas claro que el nuevo, Frontend y QA deben liderar una recuperacion de jerarquia antes de seguir innovando.
- No confundir ejemplo con regla. Si el usuario menciona pixel art, juegos, cocina, mapas o aprendizaje, el equipo debe preguntarse que hace buena a esa idea y proponer la mejor forma para este producto, aunque acabe siendo otra distinta.

### Reglas Para Recomendaciones Y Aprendizaje

- El aprendizaje del usuario debe ser local, transparente y reversible mientras no haya backend: historial, comidas repetidas, combinaciones frecuentes, alimentos recientes y favoritos.
- Las recomendaciones deben combinar comportamiento real con sentido comun nutricional. Si no hay historial suficiente, usar reglas razonables y conservadoras.
- Nunca presentar aprendizaje como si fuese inteligencia segura si solo hay pocos datos. Usar textos como "Sueles combinar" o "Puede encajar", no afirmaciones absolutas.
- Las recomendaciones deben reducir pasos para registrar comida. Si anaden otra pantalla, panel pesado o ruido, se aparcan.

### Politica De Apuestas

- Un ciclo puede tener una sola apuesta principal: visual, flujo, recomendacion, persistencia o dominio.
- Si una idea creativa toca mas de dos areas a la vez, partirla.
- Si la app esta descuadrada o hay features rotas, primero estabilizar. La creatividad vuelve cuando QA declare recuperada la confianza.
- Las ideas que gusten pero no quepan se guardan como backlog, no se meten parcialmente.

## Preflight Del Ciclo

Antes de convocar la reunion general, hacer una inspeccion corta del estado real del proyecto. El objetivo es no elegir trabajo redundante, inseguro o basado en una prioridad vieja.

Preflight obligatorio:

- Leer `AGENTS.md`, `README.md` y `TEAM_LOOP.md`.
- Revisar el estado actual del codigo con busquedas dirigidas sobre la prioridad candidata, funciones relacionadas y flujos afectados.
- Confirmar si la capacidad candidata ya existe, esta incompleta, esta rota o no existe.
- Detectar si el backlog vivo quedo obsoleto por cambios recientes.
- Identificar riesgos de persistencia, historial, UX, responsive, consola y validacion.
- Revisar si la tarea podria tocar `left-eat-state-v1`, `meal.items`, snapshots, plantillas, historial o calculos nutricionales.

Resultado obligatorio del preflight:

- Hechos observados en codigo o docs.
- Prioridades que parecen ya resueltas o en revision.
- Riesgos que activarian veto de Persistencia/Estado o QA.
- Lista corta de candidatas razonables para la reunion general.

## Reunion General

La reunion general debe responder:

- Como ve cada rol el estado actual del proyecto.
- Cual es el bloqueo mas importante ahora.
- Que tarea unica mueve mas el producto.
- Que indica el preflight sobre el estado real de esa tarea.
- Que rol lidera esa tarea.
- Que riesgos se aceptan y cuales se bloquean.
- Cual queda como siguiente prioridad tentativa.

La decision debe ser valiente pero acotada. No se eligen tareas grandes si pueden partirse en una mejora verificable.

## Matriz De Priorizacion

Cuando haya varias tareas candidatas, puntuar cada una de 0 a 2 en estos criterios:

- Valor para uso diario: mejora clara del flujo principal.
- Reduccion de riesgo: baja probabilidad de perdida de datos, confusion o regresion.
- Reversibilidad: se puede deshacer o ajustar sin migracion irreversible.
- Tamano pequeno: cabe en un ciclo acotado y verificable.
- Confianza de validacion: puede comprobarse con checks estaticos y, si aplica, navegador.

Elegir la tarea con mejor balance total. Si hay empate, elegir la que proteja mejor datos, compatibilidad y uso diario. Persistencia/Estado y QA pueden vetar aunque la puntuacion sea alta.

## Reunion Especifica De Tarea

Antes de editar archivos, hacer una reunion concreta sobre la tarea elegida:

- Producto/UX define alcance, copy y comportamiento esperado.
- Dominio define reglas si hay logica de negocio.
- Persistencia define limites de estado y compatibilidad.
- Frontend define integracion visual e interaccion.
- QA define bloqueantes y pruebas minimas.

Resultado obligatorio:

- Decision final.
- Rol lider.
- Archivos probables a tocar.
- Criterios de aceptacion.
- Criterios de bloqueo.
- Plan de validacion.

## Definicion De Hecho

Un ciclo solo queda hecho si cumple todo lo aplicable:

- La tarea elegida es unica, acotada y reversible.
- Los criterios de aceptacion definidos en la reunion especifica estan cumplidos.
- No se cambia la clave `left-eat-state-v1`.
- No se renombra ni elimina `meal.items`.
- No se duplican calculos nutricionales en `src/app.js` si pueden venir de `Nutrition`.
- Si se toca JS, pasan los checks obligatorios de sintaxis.
- Si se toca frontend, se valida en navegador local y se revisa consola cuando sea posible.
- Si no se puede validar algo importante, queda reportado como riesgo restante.

## Reglas De Autonomia

- No pedir confirmacion al usuario durante el ciclo.
- No hacer commits ni push salvo instruccion explicita.
- No instalar dependencias salvo instruccion explicita.
- No usar credenciales ni acciones que requieran aprobacion externa.
- No borrar historial.
- No hacer cambios irreversibles de formato persistido.
- No cambiar la clave `left-eat-state-v1`.
- No renombrar ni eliminar `meal.items`.
- Usar `Nutrition.summarizeDay(day, profile, foods)` como fuente principal del diario.
- Mantener vanilla HTML/CSS/JS.
- Si un comando requiere escalado y no hay aprobacion disponible, saltarlo y usar validacion alternativa.

## Backlog Vivo

Este backlog sustituye al orden inicial de prioridades. Es una guia operativa, no una verdad fija: cada ciclo debe verificar el estado real en codigo antes de elegir tarea.

### Hecho / Mantener

- Historial confiable y cierre de dia: mantener y vigilar regresiones.
- Auditoria estructural inicial: mantener higiene de proyecto con `scripts/validate-project-structure.mjs`, `.gitignore` cubriendo logs/reportes y sin artefactos generados al cerrar ciclos.

### En Revision

Estas areas ya tienen senales de implementacion en el codigo. Antes de elegirlas como tarea, el preflight debe confirmar si estan completas, incompletas o rotas.

- Snapshots minimos de dias guardados.
- Plantillas de comidas tolerantes a alimentos editados u ocultos.
- Seguridad de interaccion: deshacer, feedback y recuperacion.
- Deuda estructural de frontend: `src/styles.css` y `src/app.js` han crecido mucho. Ya existe inventario CSS con `scripts/report-css-structure.mjs`; usarlo para eliminar capas historicas verificables en ciclos pequenos. Despues valorar extraccion de sprites/render helpers si no rompe orden de carga.

### Siguiente

- Entrada rapida con favoritos, recientes y cantidades frecuentes.
- Diagnostico nutricional accionable.
- Sugerencias concretas derivadas del diagnostico.
- Acciones explicitas sobre sugerencias, si no comprometen persistencia ni flujo.
- Reunion general de revision y nueva priorizacion.

### Bloqueado

- Cambios que requieren migracion persistida sin diseno explicito.
- Cambios que requieren dependencias, credenciales, backend o aprobacion externa.

### Aparcado

- Refactors visuales grandes cuando la tarea no sea visual.
- Cambios de arquitectura que no sean necesarios para el ciclo actual, salvo la auditoria estructural priorizada.

## Validacion Obligatoria

Ejecutar siempre:

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

Cuando sea posible, validar en navegador local:

- Cargar diario sin errores de consola.
- Anadir y quitar alimento.
- Usar deshacer si aplica.
- Anadir y quitar comida.
- Comidas guardadas.
- Guardar y limpiar.
- Historial y solo lectura.
- Alimentos -> Diario.
- Responsive sin overflow horizontal.

Si el navegador no puede abrirse, documentar la limitacion y cubrir con checks estaticos y revision de flujo en codigo.

## Formato De Reporte

Al final de cada ciclo, reportar en espanol:

- Fecha del ciclo.
- Que se decidio.
- Quien lidero.
- Que opciones se descartaron y por que.
- Que se cambio.
- Que pruebas pasaron.
- Que no se pudo validar.
- Que riesgo restante queda.
- Cual queda como siguiente prioridad.

Mantener el reporte breve y factual.

## Registro De Decision Y Retro

El reporte final debe dejar una mini retro reutilizable por el siguiente ciclo:

- Decision: tarea elegida, lider y motivo.
- Descartes: opciones relevantes que no se eligieron.
- Resultado: cambio realizado o motivo por el que se aparco.
- Validacion: pruebas ejecutadas y limitaciones.
- Riesgo restante: dudas, deuda o regresiones posibles.
- Siguiente prioridad: candidata inicial para el proximo preflight.

## Prompt Reutilizable Para Otro Chat

```txt
Quiero trabajar con un loop autonomo de equipo para este proyecto.

Convoca roles exigentes de Producto/UX, Dominio/Nutricion, Persistencia/Estado, Frontend/Interaccion y QA. En cada ciclo:

1. Haced preflight leyendo AGENTS.md, README.md y TEAM_LOOP.md, y revisando el codigo relacionado con las prioridades candidatas.
2. Revisad el backlog vivo y detectad prioridades ya resueltas, en revision o bloqueadas.
3. Haced una reunion general.
4. Elegid una sola tarea prioritaria usando la matriz de priorizacion.
5. Asignad un rol lider con mas peso de decision.
6. Haced una reunion especifica de esa tarea.
7. Implementad un cambio acotado y reversible.
8. Validad contra la definicion de hecho.
9. Reportad en espanol que se decidio, que se descarto, que se cambio, que pruebas pasaron, que riesgo queda y cual es la siguiente prioridad.

No me pidais decisiones durante el ciclo. Si hay varias opciones razonables, elegid la que proteja datos, compatibilidad y uso diario. Si algo puede perder datos, cambiar formato persistido de forma irreversible, borrar historial, instalar dependencias, requerir credenciales o requerir aprobacion externa, no lo hagais y avanzad con una alternativa segura.

Aprended el fondo, no la forma. Si el usuario trae una idea desde otro ambito, extraed el principio de producto que hay debajo y proponed una traduccion propia para este proyecto. No copieis literalmente el ejemplo salvo que esa sea la mejor solucion para Left2Eat.

No hagais commits ni push salvo instruccion explicita. Mantened el estilo y arquitectura existentes del proyecto.
```

## Version Corta Para Heartbeat

```txt
Continuar el loop autonomo de equipo. Hacer preflight leyendo AGENTS.md, README.md y TEAM_LOOP.md; revisar codigo y backlog vivo; convocar roles de Producto/UX, Dominio/Nutricion, Persistencia/Estado, Frontend/Interaccion y QA; elegir una unica tarea prioritaria con matriz simple; asignar lider; hacer reunion especifica; implementar cambio acotado; validar contra definicion de hecho; reportar decision, descartes, cambios, pruebas, riesgo restante y siguiente prioridad. No pedir input al usuario. Aprender el fondo, no la forma: si aparece una idea de otro ambito, extraer el principio de producto y traducirlo a Left2Eat sin copiar literalmente salvo que sea lo mejor. Elegir opciones conservadoras si hay riesgo para datos, compatibilidad o uso diario. No instalar dependencias ni hacer commits o push salvo instruccion explicita.
```
