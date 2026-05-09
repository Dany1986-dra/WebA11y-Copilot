# WebA11y Copilot - Documento de explicacion del sistema

## 1. Resumen ejecutivo

WebA11y Copilot es un sistema web que ayuda a detectar barreras de accesibilidad en paginas y aplicaciones mediante una combinacion de reglas deterministas basadas en WCAG 2.2 y analisis asistido por inteligencia artificial de Google.

El proyecto esta pensado para apoyar a desarrolladores, equipos educativos, emprendimientos pequenos y organizaciones que necesitan mejorar la accesibilidad de sus sitios, pero que no siempre cuentan con especialistas en WCAG, pruebas con tecnologias de asistencia o auditorias profesionales completas.

La aplicacion permite pegar una descripcion estructurada de una pagina web en formato JSON y devuelve:

- Problemas de accesibilidad encontrados.
- Evidencia concreta de cada problema.
- Recomendaciones de correccion.
- Versiones simplificadas del contenido.
- Pasos de navegacion mas claros para usuarios con baja vision, dislexia, sobrecarga cognitiva u otras necesidades de apoyo.

El objetivo no es reemplazar una auditoria profesional completa, sino ofrecer una herramienta practica, rapida y educativa que acerque las buenas practicas de accesibilidad a mas personas.

La propuesta combina impacto social, utilidad tecnica y una demo verificable. El sistema no se limita a decir si una pagina "pasa" o "falla"; transforma problemas de accesibilidad en explicaciones que una persona desarrolladora puede entender y corregir.

## 2. Problema que resuelve

Muchas paginas web tienen barreras que dificultan o impiden su uso por parte de personas con discapacidad. Entre los problemas mas comunes estan:

- Imagenes sin texto alternativo.
- Campos de formulario sin etiquetas.
- Enlaces ambiguos como "click aqui".
- Paginas sin encabezados semanticos.
- Contenido dificil de leer o navegar.
- Flujos de compra, registro o consulta que generan sobrecarga cognitiva.

Estos errores pueden parecer pequenos desde el punto de vista visual, pero tienen un impacto real en personas que usan lectores de pantalla, magnificadores, navegacion por teclado o que necesitan instrucciones mas claras.

WebA11y Copilot convierte esos problemas en hallazgos comprensibles y accionables. En lugar de mostrar solo un codigo tecnico, explica que esta mal, donde esta la evidencia y como repararlo.

## 3. Publico objetivo

El sistema esta dirigido a:

- Desarrolladores frontend que necesitan revisar accesibilidad rapidamente.
- Estudiantes que estan aprendiendo WCAG y buenas practicas web.
- Docentes que quieren demostrar problemas comunes de accesibilidad.
- Pequenos negocios que no tienen presupuesto para auditorias completas.
- Equipos que desean una primera revision antes de pruebas manuales.

Tambien puede servir como herramienta de apoyo para personas que necesitan transformar contenido complejo en instrucciones mas simples.

## 4. Funcionamiento general

El usuario ingresa un JSON con la estructura principal de una pagina. Por ejemplo:

```json
{
  "title": "Checkout",
  "headings": ["Carrito de compras"],
  "paragraphs": ["Tu carrito contiene 3 productos"],
  "links": [{ "text": "Haz clic aqui", "href": "/help" }],
  "images": [{ "src": "/banner.png", "alt": "" }],
  "forms": [{ "name": "email", "label": "" }]
}
```

El backend procesa ese JSON en dos etapas:

1. Reglas locales WCAG.
   El sistema revisa patrones conocidos: encabezados faltantes, imagenes sin texto alternativo, enlaces ambiguos y campos de formulario sin etiqueta.

2. Analisis con IA de Google.
   El contenido se envia a un modelo de Google AI para enriquecer el analisis, priorizar problemas, simplificar textos y proponer pasos de navegacion.

La respuesta final combina ambos resultados y se presenta en la interfaz de forma clara.

## 5. Uso de Google AI

El sistema utiliza Google AI a traves de la API `generateContent`.

La arquitectura esta preparada para trabajar con modelos de Google configurables desde variables de entorno. Durante las pruebas locales, el modelo operativo principal es:

```text
gemini-2.5-flash
```

Tambien se mantiene configuracion de fallback para:

```text
gemma-4-31b-it
```

Esta decision permite que la demo sea estable aunque un modelo especifico devuelva errores temporales del proveedor. El diseno del proyecto conserva la capacidad de ejecutar Gemma 4 cuando este disponible y responde correctamente para la clave usada.

La IA no trabaja sola. El sistema usa primero reglas locales deterministas para asegurar que los hallazgos criticos no dependan exclusivamente del modelo. Luego, Google AI aporta contexto, lenguaje natural, priorizacion y explicaciones mas utiles para personas no expertas.

Esta separacion tambien mejora la confiabilidad del sistema: si el proveedor de IA no responde, la herramienta sigue ofreciendo una auditoria basica con reglas locales. Si la IA responde, el resultado se enriquece con recomendaciones, simplificacion de contenido y pasos de navegacion.

## 5.1. Diferenciador de la solucion

El diferencial de WebA11y Copilot esta en unir tres capas en una sola experiencia:

- Deteccion tecnica: reglas locales para errores frecuentes de accesibilidad.
- Explicacion humana: salida clara y accionable para usuarios no expertos.
- Apoyo cognitivo: simplificacion de contenido y guias de navegacion generadas con IA.

Muchas herramientas de accesibilidad producen reportes tecnicos extensos. Este proyecto busca que el reporte sea entendible, educativo y facil de convertir en cambios concretos.

## 6. Arquitectura tecnica

La solucion tiene una arquitectura simple y portable.

### Frontend

Archivos principales:

- `index.html`
- `styles.css`
- `app.js`

Responsabilidades:

- Capturar el JSON de entrada.
- Validar que la estructura tenga los campos requeridos.
- Enviar la solicitud al backend.
- Renderizar problemas, contenido simplificado y pasos de navegacion.
- Mantener una interfaz accesible con etiquetas, regiones ARIA y mensajes de estado.

### Backend

Archivo principal:

- `src/server/server.js`

Responsabilidades:

- Servir la aplicacion web localmente.
- Exponer `GET /health`.
- Exponer `POST /analyze`.
- Ejecutar reglas WCAG locales.
- Llamar a Google AI.
- Manejar fallback de modelos.
- Devolver respuestas estructuradas en JSON.

### Pruebas

Archivo principal:

- `tests/tests.js`

La suite valida:

- Estado del servidor.
- Carga del frontend estatico.
- Validez del archivo de ejemplo.
- Validacion de esquema.
- Deteccion de problemas WCAG.
- Estructura de respuesta.
- Manejo de payloads grandes.
- Rango de confianza.

Resultado actual:

```text
25 PASS, 0 FAIL
```

## 7. Accesibilidad implementada en la interfaz

La aplicacion tambien aplica principios de accesibilidad en su propia interfaz:

- Idioma del documento definido en espanol.
- Enlace de salto al contenido principal.
- Etiquetas asociadas a controles de formulario.
- Mensajes de error visibles.
- Region `aria-live` para anunciar cambios de estado.
- Contraste visual adecuado en elementos principales.
- Estructura de encabezados clara.
- Botones con texto visible y proposito directo.

Esto es importante porque una herramienta que evalua accesibilidad tambien debe intentar ser accesible.

## 8. Flujo de analisis

El flujo principal es:

1. El usuario abre la aplicacion.
2. Pega un JSON o carga el ejemplo incluido.
3. Presiona "Analizar".
4. El frontend valida el JSON.
5. El backend ejecuta reglas WCAG.
6. El backend consulta Google AI.
7. El sistema combina resultados.
8. La interfaz muestra:
   - Problemas detectados.
   - Contenido simplificado.
   - Pasos de navegacion.
   - Proveedor IA utilizado.

## 9. Ejemplo de hallazgos

Con una pagina de checkout que tiene imagenes sin `alt`, campos sin etiqueta y enlaces ambiguos, el sistema puede devolver hallazgos como:

- Severidad alta: imagen sin texto alternativo.
- Severidad alta: campo de formulario sin etiqueta.
- Severidad media: enlace ambiguo con texto "Haz clic aqui".

Cada hallazgo incluye una recomendacion concreta, por ejemplo:

```text
Use texto de enlace descriptivo que explique el destino o la accion.
```

Esto ayuda a que la persona desarrolladora sepa que cambiar, no solo que existe un error.

## 10. Decisiones de diseno

### Reglas locales mas IA

El sistema no depende solamente de IA porque algunas reglas de accesibilidad deben ser consistentes y verificables. Por eso se implementan reglas locales para problemas comunes y luego se usa IA para enriquecer el resultado.

### JSON como entrada

Se eligio JSON porque permite representar una pagina de manera simple, portable y facil de probar. En futuras versiones, el sistema podria extraer automaticamente esa estructura desde una URL real.

### Backend separado

La clave de API no debe exponerse en el navegador durante uso local o produccion con backend. Por eso el backend lee la clave desde `.env` y el frontend solo consume el endpoint `/analyze`.

El campo de API key en la interfaz existe para escenarios sin backend, como demostraciones estaticas, pero no es necesario cuando el servidor local o desplegado esta funcionando.

### Fallback de modelo

La integracion con IA incluye fallback porque los modelos pueden cambiar de disponibilidad o devolver errores temporales. Esto hace que la demo sea mas confiable.

### Privacidad y manejo de claves

La clave de Google AI se mantiene en el backend mediante variables de entorno. En el flujo recomendado, el navegador no necesita conocer la clave. Esto reduce el riesgo de exponer secretos en una demo publica o en un repositorio.

El sistema puede funcionar en dos modos:

- Modo backend: recomendado para demos y produccion, con la clave protegida en el servidor.
- Modo directo: opcion de respaldo para despliegues estaticos, donde el usuario proporciona una clave manualmente.

Para el concurso, el modo backend es el mas seguro y estable.

## 11. Estado actual del proyecto

El proyecto fue probado localmente con el siguiente resultado:

- Servidor local activo en `http://localhost:8787/`.
- Frontend cargando correctamente.
- Boton "Cargar ejemplo" funcionando.
- Boton "Analizar" funcionando.
- Proveedor IA respondiendo como `google (gemini-2.5-flash)`.
- Pruebas automatizadas pasando: `25 PASS, 0 FAIL`.

Tambien se corrigieron problemas detectados durante la verificacion:

- El servidor no servia la pagina principal desde `/`.
- El JSON de ejemplo tenia dos objetos pegados y no era valido.
- Node.js no podia validar certificados HTTPS en Windows, corregido con `--use-system-ca`.
- El sistema ahora muestra errores de proveedor de forma controlada si la IA falla.

## 12. Como ejecutar el sistema

Instalar dependencias:

```bash
npm install
```

Crear archivo `.env`:

```text
PORT=8787
GOOGLE_API_KEY=tu_api_key
GOOGLE_MODEL=gemini-2.5-flash
GOOGLE_FALLBACK_MODEL=gemma-4-31b-it
```

Iniciar:

```bash
npm start
```

Abrir:

```text
http://localhost:8787/
```

Ejecutar pruebas:

```bash
npm test
```

## 13. Impacto esperado

WebA11y Copilot puede ayudar a reducir barreras digitales al hacer que la accesibilidad sea mas facil de revisar, aprender y aplicar.

El impacto principal esta en tres areas:

- Educacion: explica problemas de accesibilidad en lenguaje claro.
- Productividad: acelera revisiones iniciales antes de auditorias manuales.
- Inclusion: promueve que mas equipos incorporen accesibilidad desde etapas tempranas.

Una mejora pequena, como agregar texto alternativo o etiquetar correctamente un formulario, puede cambiar completamente la experiencia de una persona que depende de tecnologias de asistencia.

## 13.1. Criterios de exito

El proyecto puede evaluarse con criterios claros:

- El usuario puede cargar un ejemplo y recibir resultados sin configurar nada en el navegador.
- El backend mantiene protegida la clave de API.
- Las reglas WCAG locales detectan errores comunes aunque la IA no este disponible.
- Google AI mejora la salida con lenguaje natural, simplificacion y recomendaciones.
- Las pruebas automatizadas validan los endpoints, el esquema de entrada y los hallazgos basicos.
- La interfaz es usable por teclado y comunica cambios mediante regiones accesibles.

## 14. Mejoras futuras

Las siguientes mejoras pueden ampliar el alcance del sistema:

- Analizar una URL real automaticamente.
- Integrar captura del DOM desde una extension del navegador.
- Exportar reportes en PDF.
- Guardar historiales de auditoria.
- Agregar puntuacion por criterio WCAG.
- Incluir pruebas guiadas con teclado.
- Generar pull requests automaticos con sugerencias de correccion.

## 14.1. Limitaciones conocidas

La version actual analiza una representacion JSON de la pagina, no una URL completa. Esto hace que la demo sea controlable y facil de probar, pero tambien limita el alcance frente a una auditoria automatica de DOM real.

Algunos problemas de accesibilidad requieren revision manual: contraste exacto en todos los estados, orden de foco, lectura con tecnologias de asistencia, comportamiento de componentes dinamicos y pruebas con usuarios. Por eso el sistema se presenta como una herramienta de apoyo y aprendizaje, no como certificacion final de cumplimiento.

## 15. Conclusion

WebA11y Copilot demuestra como Google AI puede combinarse con reglas tecnicas de accesibilidad para crear una herramienta practica, educativa y orientada a impacto social.

El sistema convierte barreras web comunes en explicaciones accionables, ayuda a simplificar contenido complejo y ofrece pasos de navegacion mas claros. Su valor esta en hacer que la accesibilidad deje de ser un tema reservado para especialistas y se convierta en una practica diaria para cualquier persona que construye la web.
