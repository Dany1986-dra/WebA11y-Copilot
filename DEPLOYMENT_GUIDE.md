# 🚀 Deployment: GitHub Pages + Render Backend

## Parte 1: Frontend en GitHub Pages

### Paso 1: Configurar GitHub Pages
1. Sube este repo a GitHub
2. En **Settings → Pages**
3. Selecciona **Source: Deploy from a branch**
4. Branch: **main** → Folder: **/ (root)**
5. Save

Tu frontend estará en: `https://tu-usuario.github.io/weba11y-copilot`

---

## Parte 2: Backend en Render.com

### Paso 1: Preparar el backend
El archivo `src/server/server.js` está listo para Render.

### Paso 2: Crear servicio en Render
1. Ve a [render.com](https://render.com)
2. Conecta tu GitHub repo
3. **New > Web Service**
4. Selecciona el repo `weba11y-copilot`
5. Configura:
   - **Name:** `weba11y-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. Opcional: Render detecta `render.yaml` y autocompleta esta configuración

### Paso 3: Agregar variables de entorno
En Render dashboard, en tu servicio:
- Click en **Environment**
- Agrega:
  ```
  GOOGLE_API_KEY=sk-...
  OPENROUTER_API_KEY=sk-...
  PORT=3000
  ```

### Paso 4: Obtener URL del backend
Una vez desplegado, Render te dará una URL tipo:
```
https://weba11y-backend.onrender.com
```

---

## Paso 5: Configurar URL de backend en Frontend

El frontend ya usa localhost en desarrollo y URL de producción por defecto.

Si quieres forzar tu URL real de Render sin tocar código:

1. Abre tu frontend publicado
2. Presiona F12 y abre consola
3. Ejecuta:

```javascript
localStorage.setItem("weba11y_backend_url", "https://TU-SERVICIO.onrender.com");
location.reload();
```

Para restaurar comportamiento default:

```javascript
localStorage.removeItem("weba11y_backend_url");
location.reload();
```

---

## Paso 6: Commit y Push

```bash
git add .
git commit -m "GitHub Pages + Render backend deployment ready"
git push origin main
```

GitHub Pages desplegará automáticamente.

---

## ✅ Resultado Final

- **Frontend:** `https://tu-usuario.github.io/weba11y-copilot`
- **Backend:** `https://weba11y-backend.onrender.com` (tu URL)
- **Funcionamiento:** Frontend estático + Backend Node.js remoto

---

## 🔧 Para Desarrollo Local

```bash
npm install
npm start  # Backend en http://localhost:8787

# En otra terminal:
# Abre index.html con Live Server (http://localhost:5500)
```

---

## ⚠️ Notas

- **Render Free:** Se duerme después de 15 min de inactividad (toma ~30s en reactivarse)
- **Upgrade a Paid ($12/mes):** Para evitar dormancia
- **CORS:** Backend debe tener CORS habilitado (✅ ya está en server.js)
- **Timeout:** GitHub Pages a Render puede tardar 5-10s en el primer request

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| 404 en GitHub Pages | Verifica que estén `index.html`, `app.js`, `styles.css` en la raíz |
| Backend no responde | Verifica que Render esté verde (desplegado) |
| CORS error | Asegúrate de que `server.js` tenga `app.use(cors())` |
| Variables de entorno vacías | Agrégalas en Render dashboard |

