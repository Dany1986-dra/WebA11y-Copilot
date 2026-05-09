export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json(
        {
          ok: true,
          providerConfigured: Boolean(env.GOOGLE_API_KEY || env.OPENROUTER_API_KEY)
        },
        200,
        corsHeaders
      );
    }

    if (url.pathname === "/analyze" && request.method === "POST") {
      try {
        const body = await request.json();
        const page = body?.page;
        if (!page) return json({ error: "Missing page payload" }, 400, corsHeaders);

        const validation = validatePageSchema(page);
        if (validation) return json({ error: validation }, 400, corsHeaders);

        const ruleIssues = runWcagChecks(page);
        const llm = await askGemmaWithFallback(page, ruleIssues, env);

        return json(
          {
            provider: llm.provider,
            issues: [...ruleIssues, ...(llm.issues || [])],
            simplified_content: llm.simplified_content || [],
            navigation_steps: llm.navigation_steps || [],
            confidence: llm.confidence ?? 0.5
          },
          200,
          corsHeaders
        );
      } catch (error) {
        return json({ error: error.message || "Internal error" }, 500, corsHeaders);
      }
    }

    return json({ error: "Not found" }, 404, corsHeaders);
  }
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

async function askGemmaWithFallback(page, ruleIssues, env) {
  const prompt = buildPrompt(page, ruleIssues);

  if (env.GOOGLE_API_KEY) {
    try {
      const googleModel = env.GOOGLE_MODEL || "gemma-4-31b-it";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${env.GOOGLE_API_KEY}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!response.ok) throw new Error(`Google API error ${response.status}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseModelJson(text);
      return { provider: "google-worker", ...parsed };
    } catch (_) {
      // fallback to OpenRouter
    }
  }

  if (env.OPENROUTER_API_KEY) {
    try {
      const model = env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: "You output strict JSON only." },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!response.ok) throw new Error(`OpenRouter API error ${response.status}`);
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      const parsed = parseModelJson(text);
      return { provider: "openrouter-worker", ...parsed };
    } catch (_) {
      // fallback to none
    }
  }

  return {
    provider: "none",
    issues: [],
    simplified_content: [],
    navigation_steps: ["Configura GOOGLE_API_KEY o OPENROUTER_API_KEY en Cloudflare Worker."],
    confidence: 0.1
  };
}

function buildPrompt(page, ruleIssues) {
  return `You are an expert web accessibility assistant (WCAG 2.2).
Input page JSON:
${JSON.stringify(page)}
Deterministic findings:
${JSON.stringify(ruleIssues)}
Return STRICT VALID JSON only:
{"issues":[{"severity":"low|medium|high","problem":"...","evidence":"...","fix":"..."}],"simplified_content":[{"section":"...","original":"...","simplified":"..."}],"navigation_steps":["..."],"confidence":0.0}`;
}

function parseModelJson(text) {
  if (!text || typeof text !== "string") return defaultModelOutput();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return defaultModelOutput();
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      simplified_content: Array.isArray(parsed.simplified_content) ? parsed.simplified_content : [],
      navigation_steps: Array.isArray(parsed.navigation_steps) ? parsed.navigation_steps : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5
    };
  } catch {
    return defaultModelOutput();
  }
}

function defaultModelOutput() {
  return {
    issues: [],
    simplified_content: [],
    navigation_steps: ["No se pudo parsear la respuesta del modelo."],
    confidence: 0.2
  };
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
