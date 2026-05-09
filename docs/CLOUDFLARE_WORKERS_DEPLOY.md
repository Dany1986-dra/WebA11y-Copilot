# Deploy backend en Cloudflare Workers (sin tarjeta)

## Requisitos

- Cuenta de Cloudflare
- Node.js instalado

## 1) Instalar Wrangler

```bash
npm install -g wrangler
```

## 2) Login

```bash
wrangler login
```

## 3) Ir a carpeta del worker

```bash
cd cloudflare
```

## 4) Configurar secretos (API keys)

```bash
wrangler secret put GOOGLE_API_KEY
```

o fallback:

```bash
wrangler secret put OPENROUTER_API_KEY
```

## 5) Deploy

```bash
wrangler deploy
```

Wrangler te devuelve URL tipo:

`https://weba11y-backend.<tu-subdominio>.workers.dev`

## 6) Conectar frontend (GitHub Pages)

Edita `index.html` y coloca:

```html
<meta name="weba11y-backend-url" content="https://weba11y-backend.<tu-subdominio>.workers.dev">
```

Haz commit/push y prueba en tu GitHub Pages.

## 7) Verificación

- Health: `https://...workers.dev/health`
- Frontend: Cargar ejemplo -> Analizar -> verificar `provider`
