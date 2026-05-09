# WebA11y Copilot 🌐♿

**Auditor inteligente de accesibilidad web con Gemma 4 31B**

Detecta problemas WCAG 2.2, simplifica contenido y genera guías de navegación usando IA.

---

## 🚀 Despliegue recomendado: GitHub Pages + Cloudflare Workers (sin tarjeta)

**Arquitectura:**
- **Frontend:** GitHub Pages (estático)
- **Backend:** Cloudflare Workers (serverless)

Ver:
- [docs/CLOUDFLARE_WORKERS_DEPLOY.md](docs/CLOUDFLARE_WORKERS_DEPLOY.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) (opción Render)

### Publicacion profesional recomendada

1. Frontend en GitHub Pages con workflow automatico (`.github/workflows/pages.yml`)
2. Backend en Cloudflare Workers (`cloudflare/worker.js`)
3. Configura URL de backend en `index.html` usando:

```html
<meta name="weba11y-backend-url" content="https://weba11y-backend.<tu-subdominio>.workers.dev">
```

Con esto evitas errores de endpoint durante la demo del concurso.

**URLs en producción:**
```
Frontend:  https://tu-usuario.github.io/weba11y-copilot
Backend:   https://weba11y-backend.<tu-subdominio>.workers.dev
```

---

## 📱 En Local (Desarrollo)

```bash
npm install
npm start       # Backend en http://localhost:8787

# En otra terminal:
# Abre index.html con Live Server en http://localhost:5500
```

---

## 📚 Documentación Completa

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Despliegue GitHub Pages + Render
- [docs/README.md](docs/README.md) - Arquitectura y API Reference
- [docs/QA_TEST_PLAN.md](docs/QA_TEST_PLAN.md) - Plan QA completo
- [docs/DEV_POST_GUIDE.md](docs/DEV_POST_GUIDE.md) - Guía para post Dev.to

---

## 🏆 Desafío Gemma 4

- **Modelo:** `google/gemma-4-31b-it` (31B denso)
- **Razón:** Mejor razonamiento WCAG + contexto 128K
- **Post:** Publica en Dev.to con link a este GitHub

---

## 🔧 Stack

- **Backend:** Node.js + Express + Gemma 4 API
- **Frontend:** HTML/CSS/JS Accesible (WCAG AA)
- **Deploy:** GitHub Pages (frontend) + Render (backend)
- **Testing:** npm test (12 pruebas incluidas)

---

## 📄 Estructura

```
weba11y-copilot/
├── 📄 index.html              → Frontend principal
├── 📄 app.js                  → JavaScript del cliente
├── 📄 styles.css              → Estilos accesibles
├── 📁 src/server/server.js    → Backend (Render)
├── 📁 data/                   → Datos de prueba
├── 📁 docs/                   → Documentación
├── 📁 tests/                  → Suite de tests
└── 📄 DEPLOYMENT_GUIDE.md     → Guía de despliegue
```

---

## ✅ Próximos Pasos

1. **GitHub:** `git push` este repo
2. **GitHub Pages:** Configurar en Settings → Pages
3. **Render:** Crear servicio web con `src/server/server.js`
4. **Actualizar:** URL de Render en `app.js`
5. **Dev.to:** Publicar post con link al GitHub

---

**Licencia:** MIT  
**Desafío:** Gemma 4 Challenge (Dev.to) - Vence 24 mayo 2026

