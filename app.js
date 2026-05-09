/**
 * WebA11y Copilot - Frontend Client
 * 
 * Interfaz accesible para análisis de páginas web
 * - Valida JSON de entrada
 * - Llamadas asincrónicas al servidor
 * - Renderización dinámica de resultados
 * - Soporte ARIA live regions para lectores de pantalla
 */

// Referencias DOM
const form = document.getElementById("analyze-form");
const input = document.getElementById("page-json");
const jsonError = document.getElementById("json-error");
const issuesList = document.getElementById("issues-list");
const simplifiedList = document.getElementById("simplified-list");
const stepsList = document.getElementById("steps-list");
const providerValue = document.getElementById("provider-value");
const liveRegion = document.getElementById("live-region");
const loadMockBtn = document.getElementById("load-mock-btn");
const providerSelect = document.getElementById("provider");
const apiKeyInput = document.getElementById("api-key");

function getBackendUrl() {
  const metaConfigured = document
    .querySelector('meta[name="weba11y-backend-url"]')
    ?.getAttribute("content")
    ?.trim();
  if (metaConfigured) return metaConfigured.replace(/\/+$/, "");

  const configuredUrl = window.localStorage.getItem("weba11y_backend_url");
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  const devHosts = ["localhost", "127.0.0.1", "::1"];
  if (devHosts.includes(window.location.hostname) || window.location.protocol === "file:") {
    return "http://localhost:8787";
  }

  const envConfigured = window.WEBA11Y_BACKEND_URL;
  if (typeof envConfigured === "string" && envConfigured.trim()) {
    return envConfigured.trim().replace(/\/+$/, "");
  }

  return "https://weba11y-backend.onrender.com";
}

/**
 * Botón "Cargar ejemplo"
 * Carga mock-analysis.json para demostración rápida
 */
loadMockBtn.addEventListener("click", async () => {
  const mockPaths = ["data/mock-analysis.json", "./mock-analysis.json"];

  try {
    let loaded = null;
    for (const path of mockPaths) {
      const res = await fetch(path);
      if (res.ok) {
        loaded = await res.json();
        break;
      }
    }

    if (!loaded) throw new Error("Archivo de ejemplo no encontrado");
    input.value = JSON.stringify(loaded.page ?? loaded, null, 2);
    announce("Ejemplo cargado");
  } catch (error) {
    jsonError.textContent = "No se pudo cargar el ejemplo. Verifica que exista mock-analysis.json.";
    announce("Error al cargar ejemplo");
  }
});

/**
 * Formulario de análisis
 * 1. Valida JSON
 * 2. Valida schema requerido
 * 3. Envía al servidor
 * 4. Renderiza resultados
 */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  jsonError.textContent = "";
  providerValue.textContent = "-";
  clearResults();

  let page;
  try {
    const parsed = JSON.parse(input.value);
    page = parsed.page ?? parsed;
  } catch {
    jsonError.textContent = "El JSON no es valido.";
    announce("Error: JSON invalido");
    return;
  }

  if (!page || typeof page !== "object") {
    jsonError.textContent = "El JSON debe ser un objeto válido.";
    announce("Error: JSON invalido");
    return;
  }

  const schemaError = validatePage(page);
  if (schemaError) {
    jsonError.textContent = schemaError;
    announce(`Error: ${schemaError}`);
    return;
  }

  try {
    announce("Analizando...");
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error del servidor");

    providerValue.textContent = data.provider || "none";
    renderIssues(data.issues || []);
    renderSimplified(data.simplified_content || []);
    renderSteps(data.navigation_steps || []);
    announce(`Analisis completado. ${data.issues?.length || 0} problemas detectados.`);
  } catch (error) {
    try {
      const direct = await analyzeDirectWithGemma(page);
      providerValue.textContent = direct.provider || "direct";
      renderIssues(direct.issues || []);
      renderSimplified(direct.simplified_content || []);
      renderSteps(direct.navigation_steps || []);
      announce(`Analisis completado. ${direct.issues?.length || 0} problemas detectados.`);
    } catch (directError) {
      const networkHint = "Sin backend y sin API key valida. Inicia backend con npm start o pega tu API key arriba.";
      jsonError.textContent = directError.message.includes("API key") ? directError.message : networkHint;
      announce("Error al analizar");
    }
  }
});

async function analyzeDirectWithGemma(page) {
  const provider = providerSelect?.value || "openrouter";
  const apiKey = (apiKeyInput?.value || "").trim();
  if (!apiKey) throw new Error("Falta API key para modo GitHub Pages.");

  const ruleIssues = runLocalWcagChecks(page);
  const prompt = buildGemmaPrompt(page, ruleIssues);

  if (provider === "google") {
    const model = "gemma-4-31b-it";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!response.ok) throw new Error("Google API key invalida o request bloqueado.");
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = parseJsonSafe(text);
    return {
      provider: "google-direct",
      issues: [...ruleIssues, ...(parsed.issues || [])],
      simplified_content: parsed.simplified_content || [],
      navigation_steps: parsed.navigation_steps || [],
      confidence: parsed.confidence ?? 0.5
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "google/gemma-4-31b-it:free",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!response.ok) throw new Error("OpenRouter API key invalida o sin cuota.");
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "{}";
  const parsed = parseJsonSafe(text);
  return {
    provider: "openrouter-direct",
    issues: [...ruleIssues, ...(parsed.issues || [])],
    simplified_content: parsed.simplified_content || [],
    navigation_steps: parsed.navigation_steps || [],
    confidence: parsed.confidence ?? 0.5
  };
}

function buildGemmaPrompt(page, ruleIssues) {
  return `You are an expert web accessibility assistant (WCAG 2.2).
Input page JSON:
${JSON.stringify(page)}
Deterministic findings:
${JSON.stringify(ruleIssues)}
Return STRICT VALID JSON only:
{"issues":[{"severity":"low|medium|high","problem":"...","evidence":"...","fix":"..."}],"simplified_content":[{"section":"...","original":"...","simplified":"..."}],"navigation_steps":["..."],"confidence":0.0}`;
}

function parseJsonSafe(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
}

function runLocalWcagChecks(page) {
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
  return issues;
}

/**
 * Valida que el JSON tenga la estructura requerida
 * Propiedades obligatorias: title, headings, paragraphs, links, images, forms
 */
function validatePage(page) {
  const required = ["title", "headings", "paragraphs", "links", "images", "forms"];
  for (const key of required) {
    if (!(key in page)) return `Falta propiedad obligatoria: ${key}`;
  }
  if (!Array.isArray(page.headings)) return "headings debe ser arreglo.";
  if (!Array.isArray(page.paragraphs)) return "paragraphs debe ser arreglo.";
  if (!Array.isArray(page.links)) return "links debe ser arreglo.";
  if (!Array.isArray(page.images)) return "images debe ser arreglo.";
  if (!Array.isArray(page.forms)) return "forms debe ser arreglo.";
  return "";
}

/**
 * Renderiza lista de problemas detectados
 * Clasificación por severidad: high, medium, low
 */
function renderIssues(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    issuesList.innerHTML = '<li class="empty-state">No se detectaron problemas con las reglas básicas.</li>';
    return;
  }

  for (const item of issues) {
    const li = document.createElement("li");
    const severity = item.severity || "low";
    li.className = `issue-${severity}`;
    li.innerHTML = `<strong>[${escapeHtml(severity.toUpperCase())}]</strong> ${escapeHtml(item.problem || "Sin titulo")} - ${escapeHtml(item.fix || "Sin recomendacion")}`;
    issuesList.appendChild(li);
  }
}

/**
 * Renderiza contenido simplificado por secciones
 * Útil para usuarios con sobrecarga cognitiva o dislexia
 */
function renderSimplified(items) {
  if (!Array.isArray(items) || items.length === 0) {
    simplifiedList.innerHTML = '<li class="empty-state">No hubo contenido para simplificar en este análisis.</li>';
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(item.section || "Seccion")}:</strong> ${escapeHtml(item.simplified || "")}`;
    simplifiedList.appendChild(li);
  }
}

/**
 * Renderiza pasos de navegación
 * Guía paso-a-paso generada por Gemma para facilitar navegación
 */
function renderSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    stepsList.innerHTML = '<li class="empty-state">No se generaron pasos de navegación para este análisis.</li>';
    return;
  }

  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  }
}

function clearResults() {
  issuesList.innerHTML = "";
  simplifiedList.innerHTML = "";
  stepsList.innerHTML = "";
}

function announce(message) {
  liveRegion.textContent = "";
  setTimeout(() => (liveRegion.textContent = message), 100);
}

function escapeHtml(text) {
  const safeText = String(text ?? "");
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return safeText.replace(/[&<>"']/g, (m) => map[m]);
}
