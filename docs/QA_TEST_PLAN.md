# QA Test Plan

## Objetivo

Validar que el sistema funcione para demo y concurso:

- backend activo,
- analisis de accesibilidad correcto,
- integracion con Gemma,
- UX accesible basica.

## Pruebas manuales

1. Backend responde:
   - abrir `/health`
   - esperar `ok: true`.
2. Flujo principal:
   - cargar ejemplo,
   - analizar,
   - revisar issues, simplificacion y pasos.
3. Error controlado:
   - enviar JSON invalido,
   - confirmar mensaje claro en UI.
4. Accesibilidad UI:
   - usar tabulacion de teclado,
   - verificar foco visible,
   - probar enlace "Ir al contenido principal".

## Pruebas automatizadas

Ejecutar:

```bash
npm test
```

Cobertura actual:

- endpoint `/health`,
- validacion de schema,
- reglas WCAG base,
- estructura de respuesta.
# QA Test Plan - WebA11y Copilot

## 1. Pruebas Unitarias - Backend (server.js)

### 1.1 Endpoint `/health`
```bash
# Debe retornar status 200 con estructura válida
curl http://localhost:8787/health
# Esperado: {"ok":true,"providerConfigured":true|false}
```

**Casos de prueba:**
- ✅ Sin API key: retorna `providerConfigured: false`
- ✅ Con GOOGLE_API_KEY: retorna `providerConfigured: true`
- ✅ Con OPENROUTER_API_KEY: retorna `providerConfigured: true`
- ✅ Status code: 200

---

### 1.2 Endpoint `/analyze` - Validación de Schema

**Test 1.2.1: JSON válido y schema completo**
```json
{
  "page": {
    "title": "Test Page",
    "headings": ["H1", "H2"],
    "paragraphs": ["Text 1", "Text 2"],
    "links": [{"text": "Link", "href": "/test"}],
    "images": [{"src": "img.jpg", "alt": "Image"}],
    "forms": [{"name": "form1", "label": "Form"}]
  }
}
```
**Esperado:** Status 200, respuesta con `issues`, `provider`, `confidence`

---

**Test 1.2.2: Propiedades faltantes**
```json
{
  "page": {
    "title": "Test",
    "headings": []
    // Faltan: paragraphs, links, images, forms
  }
}
```
**Esperado:** Status 400, error: `"Missing required key: paragraphs"`

---

**Test 1.2.3: Types incorrectos**
```json
{
  "page": {
    "title": "Test",
    "headings": "not-an-array",
    "paragraphs": [],
    "links": [],
    "images": [],
    "forms": []
  }
}
```
**Esperado:** Status 400, error: `"headings must be an array"`

---

**Test 1.2.4: Payload vacío**
```json
{}
```
**Esperado:** Status 400, error: `"Missing page payload"`

---

### 1.3 Endpoint `/analyze` - WCAG Rule Engine

**Test 1.3.1: Detección de headings faltantes**
```json
{
  "page": {
    "title": "Page",
    "headings": [],
    "paragraphs": ["Text"],
    "links": [],
    "images": [],
    "forms": []
  }
}
```
**Esperado:** Issues incluye `"No headings found"` con `severity: "high"`

---

**Test 1.3.2: Detección de alt text faltante**
```json
{
  "page": {
    "title": "Page",
    "headings": ["H1"],
    "paragraphs": ["Text"],
    "links": [],
    "images": [{"src": "image.jpg"}],
    "forms": []
  }
}
```
**Esperado:** Issues incluye `"Image missing alt text"` con `severity: "high"`

---

**Test 1.3.3: Detección de ambiguous link text**
```json
{
  "page": {
    "title": "Page",
    "headings": ["H1"],
    "paragraphs": ["Text"],
    "links": [{"text": "Click here", "href": "/page"}],
    "images": [],
    "forms": []
  }
}
```
**Esperado:** Issues incluye `"Ambiguous link text"` con `severity: "medium"`

---

**Test 1.3.4: Detección de form fields sin label**
```json
{
  "page": {
    "title": "Page",
    "headings": ["H1"],
    "paragraphs": ["Text"],
    "links": [],
    "images": [],
    "forms": [{"name": "field1"}]
  }
}
```
**Esperado:** Issues incluye `"Form field without label"` con `severity: "high"`

---

### 1.4 Providers IA - Fallback Chain

**Test 1.4.1: Preferencia Google → OpenRouter**
```
Si GOOGLE_API_KEY y OPENROUTER_API_KEY están ambos configurados:
- Debe intentar Google primero
- Si falla, usa OpenRouter
```
**Verificación:** Revisar logs del servidor `[Fallback]`

---

**Test 1.4.2: Sin providers configurados**
```
Si GOOGLE_API_KEY y OPENROUTER_API_KEY son vacíos:
- provider: "none"
- confidence: 0.1
- navigation_steps: ["Configura API keys..."]
```

---

## 2. Pruebas Funcionales - Frontend (app.js)

### 2.1 Validación de Entrada

**Test 2.1.1: JSON no válido**
```
Acción: Copiar texto "not valid json" en textarea y enviar
Esperado: Mensaje de error "El JSON no es valido."
```

---

**Test 2.1.2: Schema incompleto**
```
Acción: Enviar JSON sin propiedad "images"
Esperado: Mensaje "Falta propiedad obligatoria: images"
```

---

### 2.2 Botón "Cargar ejemplo"

**Test 2.2.1: Carga mock-analysis.json**
```
Acción: Click en botón "Cargar ejemplo"
Esperado: Textarea se llena con JSON de mock-analysis.json
Anuncio ARIA: "Ejemplo cargado"
```

---

**Test 2.2.2: Error al cargar**
```
Acción: Simular fallo de fetch (offline)
Esperado: Error "No se pudo cargar el ejemplo."
```

---

### 2.3 Análisis y Renderización

**Test 2.3.1: Renderización de issues**
```
Acción: Enviar JSON válido
Esperado: 
- Issues renderizadas en lista
- Clasificadas por severidad (CSS classes: issue-high, issue-medium, issue-low)
- Formato: [SEVERITY] Problem - Fix
```

---

**Test 2.3.2: Renderización de simplified_content**
```
Esperado: 
- Contenido simplificado mostrado
- Formato: Section: Simplified text
```

---

**Test 2.3.3: Renderización de navigation_steps**
```
Esperado:
- Pasos listados en orden
- Cada paso es un item de lista
```

---

**Test 2.3.4: Actualización de provider**
```
Esperado: Span #provider-value contiene "google", "openrouter", o "none"
```

---

### 2.4 Accesibilidad (ARIA)

**Test 2.4.1: ARIA live region**
```
Acción: Completar análisis
Verificación: 
- aria-live="polite" en #live-region
- Anuncios se generan para cada acción
```

---

**Test 2.4.2: Skip link**
```
Acción: Presionar TAB al cargar página
Esperado: Skip link es visible y navegable a #main
```

---

**Test 2.4.3: ARIA labels en form**
```
Verificación:
- Textarea tiene aria-describedby="json-help json-error"
- Labels asociados correctamente
```

---

## 3. Pruebas de Integración

### 3.1 End-to-End

**Test 3.1.1: Flujo completo**
```
1. Abrir http://localhost:5500 (Live Server)
2. Click en "Cargar ejemplo"
3. Verificar textarea se llena
4. Click en "Analizar"
5. Esperar respuesta del servidor
6. Verificar resultados renderizados
```

**Esperado:** Todos los pasos completan sin errores

---

### 3.2 Pruebas con mock-analysis.json

**Test 3.2.1: Análisis estándar**
```
JSON: Página de checkout con múltiples problemas
Esperado: 
- Issues detectadas (headings, alt text, link text ambiguo)
- Simplified content generada
- Navigation steps generados
- Confidence score > 0.5
```

---

## 4. Pruebas de Carga

### 4.1 Límites de Payload

**Test 4.1.1: Payload máximo (2MB)**
```
Acción: Crear JSON de ~2MB
Esperado: Procesa sin problemas
```

---

**Test 4.1.2: Payload > 2MB**
```
Acción: Intentar enviar JSON > 2MB
Esperado: Error 413 Payload Too Large
```

---

## 5. Pruebas de Errores

### 5.1 Manejo de Excepciones

**Test 5.1.1: Servidor no disponible**
```
Acción: Enviar análisis con servidor apagado
Esperado: 
- Mensaje de error visible
- No crash del frontend
```

---

**Test 5.1.2: Respuesta inválida de IA**
```
Acción: IA retorna JSON mal formado
Esperado: Error capturado y mostrado al usuario
```

---

## 6. Checklist de Deployment

- [ ] `npm install` completa sin errores
- [ ] `npm start` inicia servidor en puerto 8787
- [ ] Live Server abre en puerto 5500
- [ ] `/health` endpoint retorna 200
- [ ] `/analyze` con mock-analysis.json funciona
- [ ] Frontend renderiza resultados
- [ ] ARIA live regions anuncian cambios
- [ ] No errores en console del navegador
- [ ] No errores en console del servidor

---

## 7. Métricas de Éxito

| Métrica | Target |
|---------|--------|
| JSON validation latency | < 100ms |
| Server response time | < 5s (con IA) |
| Frontend render time | < 1s |
| Accesibility score (Lighthouse) | > 90 |
| WCAG 2.2 compliance | AAA |
| Cross-browser support | Chrome, Firefox, Safari |

---

## 8. Problemas Conocidos & Resolución

### Issue: EADDRINUSE (Puerto en uso)
```bash
# Solución
lsof -i :8787
kill -9 <PID>
npm start
```

### Issue: CORS errors
```
Verificar: server.js tiene app.use(cors())
Si persiste: Verificar origin en llamadas fetch
```

### Issue: Gemma 4 timeout
```
Aumentar timeout en:
- Node.js: NODE_TIMEOUT=300000
- Request timeout en server.js
```

---

**Última actualización:** 9 de mayo de 2026
**Responsable QA:** Testing Team
**Estado:** Ready for Testing
