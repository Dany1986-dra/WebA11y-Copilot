/**
 * WebA11y Copilot - Backend Server
 * 
 * Auditoria inteligente de accesibilidad web con Gemma 4 31B
 * Combina reglas WCAG deterministas + análisis de IA para:
 * - Detectar problemas de accesibilidad
 * - Simplificar contenido complejo
 * - Generar guías de navegación
 * 
 * Endpoints:
 * - GET  /health           → Estado del servidor + providers disponibles
 * - POST /analyze          → Analiza una página web
 */

import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Cargar variables de entorno (.env)
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Puerto de ejecución (8787 por defecto)
const PORT = process.env.PORT || 8787;

// Configuración de proveedores IA
// Proveedor 1: Google AI Studio (Gemma oficial)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMMA_API_KEY;
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || "gemma-4-31b-it";
const GOOGLE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent`;

// Proveedor 2: OpenRouter (Fallback gratuito)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DISABLE_LLM = process.env.DISABLE_LLM === "true";

/**
 * GET /health
 * Verifica el estado del servidor y disponibilidad de providers
 */
app.get("/health", (_, res) => {
  res.json({
    ok: true,
    providerConfigured: Boolean(GOOGLE_API_KEY || OPENROUTER_API_KEY)
  });
});

/**
 * POST /analyze
 * Analiza una página web para detectar problemas de accesibilidad
 * 
 * Body esperado:
 * {
 *   "page": {
 *     "title": string,
 *     "headings": string[],
 *     "paragraphs": string[],
 *     "links": {text: string, href: string}[],
 *     "images": {src: string, alt?: string}[],
 *     "forms": {name?: string, label?: string}[]
 *   }
 * }
 * 
 * Respuesta:
 * {
 *   "provider": "google" | "openrouter" | "none",
 *   "issues": [{severity, problem, evidence, fix}],
 *   "simplified_content": [{section, original, simplified}],
 *   "navigation_steps": string[],
 *   "confidence": number
 * }
 */
app.post("/analyze", async (req, res) => {
  try {
    const { page } = req.body;
    if (!page) return res.status(400).json({ error: "Missing page payload" });

    // Validar estructura del JSON
    const validation = validatePageSchema(page);
    if (validation) return res.status(400).json({ error: validation });

    // Paso 1: Ejecutar reglas WCAG deterministas
    const ruleIssues = runWcagChecks(page);
    
    // Paso 2: Llamar a Gemma 4 para análisis inteligente
    const llm = await askGemmaWithFallback(page, ruleIssues);

    // Paso 3: Combinar resultados
    return res.json({
      provider: llm.provider,
      issues: [...ruleIssues, ...(llm.issues || [])],
      simplified_content: llm.simplified_content || [],
      navigation_steps: llm.navigation_steps || [],
      confidence: llm.confidence ?? 0.5
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    console.error("Tip: set another port in .env, for example PORT=8788");
    process.exit(1);
  }
  console.error("Server error:", error.message);
  process.exit(1);
});

/**
 * Llamada inteligente con fallback
 * Intenta Google primero, si falla usa OpenRouter, si ambos fallan retorna respuesta default
 */
async function askGemmaWithFallback(page, ruleIssues) {
  if (DISABLE_LLM) {
    return {
      provider: "none",
      issues: [],
      simplified_content: [],
      navigation_steps: ["LLM disabled (DISABLE_LLM=true)."],
      confidence: 0.1
    };
  }
  const prompt = buildPrompt(page, ruleIssues);

  // Intenta Google AI Studio
  if (GOOGLE_API_KEY) {
    try {
      const google = await callGoogleGemma(prompt);
      return { provider: "google", ...google };
    } catch (error) {
      console.warn("[Fallback] Google failed:", error.message);
    }
  }

  // Fallback a OpenRouter (gratis)
  if (OPENROUTER_API_KEY) {
    try {
      const openRouter = await callOpenRouterGemma(prompt);
      return { provider: "openrouter", ...openRouter };
    } catch (error) {
      console.warn("[Fallback] OpenRouter failed:", error.message);
    }
  }

  // Si ambos fallan, retorna respuesta sin IA
  return {
    provider: "none",
    issues: [],
    simplified_content: [],
    navigation_steps: ["Configura GOOGLE_API_KEY o OPENROUTER_API_KEY para habilitar IA."],
    confidence: 0.1
  };
}

/**
 * Construye el prompt para Gemma 4
 * Instrucciones claras + contexto WCAG + hallazgos deterministas
 */
function buildPrompt(page, ruleIssues) {
  return `
You are an expert web accessibility assistant (WCAG 2.2).
Goal: help users with low vision, dyslexia, and cognitive overload.

Input page JSON:
${JSON.stringify(page)}

Deterministic findings:
${JSON.stringify(ruleIssues)}

Return STRICT VALID JSON only:
{
  "issues":[{"severity":"low|medium|high","problem":"...","evidence":"...","fix":"..."}],
  "simplified_content":[{"section":"...","original":"...","simplified":"..."}],
  "navigation_steps":["..."],
  "confidence": 0.0
}

Rules:
- No markdown
- No extra keys
- Keep fixes actionable and concise
- Prioritize high-impact barriers first
`;
}

async function callGoogleGemma(prompt) {
  const response = await fetch(`${GOOGLE_ENDPOINT}?key=${GOOGLE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const message = await safeText(response);
    throw new Error(`Google API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseModelJson(text, "Google response parse error");
}

async function callOpenRouterGemma(prompt) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a strict JSON generator for accessibility analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await safeText(response);
    throw new Error(`OpenRouter API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  return parseModelJson(text, "OpenRouter response parse error");
}

function parseModelJson(text, errorPrefix) {
  if (!text || typeof text !== "string") {
    return {
      issues: [],
      simplified_content: [],
      navigation_steps: ["Model returned empty output."],
      confidence: 0.2
    };
  }

  const json = extractJsonBlock(text);
  try {
    const parsed = JSON.parse(json);
    return normalizeOutput(parsed);
  } catch {
    throw new Error(`${errorPrefix}: invalid JSON`);
  }
}

function extractJsonBlock(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return "{}";
  return text.slice(first, last + 1);
}

function normalizeOutput(output) {
  return {
    issues: Array.isArray(output.issues) ? output.issues : [],
    simplified_content: Array.isArray(output.simplified_content) ? output.simplified_content : [],
    navigation_steps: Array.isArray(output.navigation_steps) ? output.navigation_steps : [],
    confidence: typeof output.confidence === "number" ? output.confidence : 0.5
  };
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return "No response body";
  }
}

function runWcagChecks(page) {
  const issues = [];

  if (!Array.isArray(page.headings) || page.headings.length === 0) {
    issues.push({
      severity: "high",
      problem: "No headings found",
      evidence: "Document has no heading structure (H1-H6).",
      fix: "Add semantic headings with a logical hierarchy."
    });
  }

  for (const link of page.links || []) {
    const text = (link.text || "").trim().toLowerCase();
    if (["click here", "here", "more", "read more", "click aqui", "aqui"].includes(text)) {
      issues.push({
        severity: "medium",
        problem: "Ambiguous link text",
        evidence: `Link text: "${link.text || ""}"`,
        fix: "Use descriptive link text that explains destination."
      });
    }
  }

  for (const image of page.images || []) {
    const alt = (image.alt || "").trim();
    if (!alt) {
      issues.push({
        severity: "high",
        problem: "Image missing alt text",
        evidence: `Image src: ${image.src || "unknown"}`,
        fix: "Provide meaningful alt text or mark decorative images."
      });
    }
  }

  for (const field of page.forms || []) {
    const label = (field.label || "").trim();
    if (!label) {
      issues.push({
        severity: "high",
        problem: "Form field without label",
        evidence: `Field: ${field.name || field.id || "unknown"}`,
        fix: "Associate each form control with a visible label."
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "low",
      problem: "No critical findings in basic checks",
      evidence: "Rule-based checks did not find major issues.",
      fix: "Run manual audit and assistive technology testing."
    });
  }

  return issues;
}

function validatePageSchema(page) {
  const required = ["title", "headings", "paragraphs", "links", "images", "forms"];
  for (const key of required) {
    if (!(key in page)) return `Missing required key: ${key}`;
  }
  if (!Array.isArray(page.headings)) return "headings must be an array";
  if (!Array.isArray(page.paragraphs)) return "paragraphs must be an array";
  if (!Array.isArray(page.links)) return "links must be an array";
  if (!Array.isArray(page.images)) return "images must be an array";
  if (!Array.isArray(page.forms)) return "forms must be an array";
  return "";
}
