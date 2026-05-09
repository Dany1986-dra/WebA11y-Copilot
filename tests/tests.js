/**
 * WebA11y Copilot - Test Suite
 * 
 * Suite de pruebas automatizadas para validar:
 * - Endpoints de la API
 * - Validación de esquema
 * - Detección de problemas WCAG
 * - Respuestas del modelo
 */

import http from "http";

// Configuración
if (!process.env.API_URL && !process.env.PORT) {
  process.env.PORT = "8789";
}
if (!process.env.DISABLE_LLM) {
  process.env.DISABLE_LLM = "true";
}
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || "8789"}`;
const SERVER_STARTUP_TIMEOUT_MS = 10000;
const SERVER_POLL_INTERVAL_MS = 250;
let passCount = 0;
let failCount = 0;
let managedServer = null;

/**
 * Función auxiliar para hacer requests HTTP
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(error.message || `Network error on ${method} ${path}`));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerAvailable() {
  try {
    const health = await makeRequest("GET", "/health");
    return health.statusCode === 200 && health.body?.ok === true;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  if (await isServerAvailable()) {
    console.log(`ℹ️  Servidor detectado en ${API_URL}`);
    return;
  }

  console.log("ℹ️  No se detectó servidor activo. Iniciando backend para pruebas...");
  const module = await import(new URL("../src/server/server.js", import.meta.url));
  managedServer = module.server;

  const timeoutAt = Date.now() + SERVER_STARTUP_TIMEOUT_MS;
  while (Date.now() < timeoutAt) {
    if (await isServerAvailable()) {
      console.log("✅ Backend listo para pruebas");
      return;
    }
    await sleep(SERVER_POLL_INTERVAL_MS);
  }

  throw new Error(
    `No se pudo iniciar el backend en ${API_URL} dentro de ${SERVER_STARTUP_TIMEOUT_MS}ms`
  );
}

async function shutdownManagedServer() {
  if (!managedServer) return;

  await new Promise((resolve, reject) => {
    managedServer.close((error) => {
      if (error) return reject(error);
      resolve();
    });
  });

  managedServer = null;
  console.log("🛑 Backend de pruebas detenido");
}

/**
 * Test helper
 */
function test(name, condition) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    failCount++;
  }
}

/**
 * Tests
 */
async function runTests() {
  console.log("🧪 Iniciando pruebas...\n");
  let criticalFailure = false;

  try {
    await ensureServerRunning();
    // Test 1: Health endpoint
    console.log("📋 Test 1: GET /health");
    const health = await makeRequest("GET", "/health");
    test("Status 200", health.statusCode === 200);
    test("Respuesta válida", health.body && health.body.ok === true);
    test("Provider field", "providerConfigured" in health.body);

    // Test 1b: Static frontend assets
    console.log("\n📋 Test 1b: Frontend estático");
    const home = await makeRequest("GET", "/");
    test("Home status 200", home.statusCode === 200);
    test("Home entrega HTML", typeof home.body === "string" && home.body.includes("WebA11y Copilot"));

    const mock = await makeRequest("GET", "/data/mock-analysis.json");
    test("Mock status 200", mock.statusCode === 200);
    test("Mock JSON válido", mock.body && mock.body.page && Array.isArray(mock.body.page.links));

    // Test 2: Missing page payload
    console.log("\n📋 Test 2: POST /analyze - Sin payload");
    const nopayload = await makeRequest("POST", "/analyze", {});
    test("Status 400", nopayload.statusCode === 400);
    test("Error message", nopayload.body && nopayload.body.error);

    // Test 3: Incomplete schema
    console.log("\n📋 Test 3: POST /analyze - Schema incompleto");
    const incomplete = await makeRequest("POST", "/analyze", {
      page: {
        title: "Test",
        headings: []
        // Faltan: paragraphs, links, images, forms
      }
    });
    test("Status 400", incomplete.statusCode === 400);
    test("Error menciona campo faltante", incomplete.body.error && incomplete.body.error.includes("required"));

    // Test 4: Valid complete schema
    console.log("\n📋 Test 4: POST /analyze - Schema válido");
    const validPayload = {
      page: {
        title: "Test Page",
        headings: [],
        paragraphs: ["Test paragraph"],
        links: [],
        images: [],
        forms: []
      }
    };
    const valid = await makeRequest("POST", "/analyze", validPayload);
    test("Status 200", valid.statusCode === 200);
    test("Response tiene 'provider'", valid.body && "provider" in valid.body);
    test("Response tiene 'issues'", valid.body && Array.isArray(valid.body.issues));

    // Test 5: WCAG - Detectar headings faltantes
    console.log("\n📋 Test 5: WCAG - Missing headings");
    const noHeadings = {
      page: {
        title: "No Headings",
        headings: [],
        paragraphs: ["Content without structure"],
        links: [],
        images: [],
        forms: []
      }
    };
    const headingsTest = await makeRequest("POST", "/analyze", noHeadings);
    const hasHeadingIssue = headingsTest.body.issues.some(
      (issue) => issue.problem && issue.problem.toLowerCase().includes("heading")
    );
    test("Detecta falta de headings", hasHeadingIssue);

    // Test 6: WCAG - Ambiguous link text
    console.log("\n📋 Test 6: WCAG - Ambiguous link text");
    const ambiguousLink = {
      page: {
        title: "Ambiguous Links",
        headings: ["Title"],
        paragraphs: [],
        links: [{ text: "Click here", href: "#" }],
        images: [],
        forms: []
      }
    };
    const linkTest = await makeRequest("POST", "/analyze", ambiguousLink);
    const hasLinkIssue = linkTest.body.issues.some(
      (issue) => issue.problem && issue.problem.toLowerCase().includes("link")
    );
    test("Detecta texto de enlace ambiguo", hasLinkIssue);

    // Test 7: WCAG - Missing alt text
    console.log("\n📋 Test 7: WCAG - Missing alt text");
    const noAlt = {
      page: {
        title: "No Alt",
        headings: ["Title"],
        paragraphs: [],
        links: [],
        images: [{ src: "image.jpg" }],
        forms: []
      }
    };
    const altTest = await makeRequest("POST", "/analyze", noAlt);
    const hasAltIssue = altTest.body.issues.some(
      (issue) => issue.problem && issue.problem.toLowerCase().includes("alt")
    );
    test("Detecta falta de alt text", hasAltIssue);

    // Test 8: WCAG - Form labels
    console.log("\n📋 Test 8: WCAG - Missing form labels");
    const noLabel = {
      page: {
        title: "No Labels",
        headings: ["Title"],
        paragraphs: [],
        links: [],
        images: [],
        forms: [{ name: "email" }]
      }
    };
    const labelTest = await makeRequest("POST", "/analyze", noLabel);
    const hasLabelIssue = labelTest.body.issues.some(
      (issue) => issue.problem && issue.problem.toLowerCase().includes("label")
    );
    test("Detecta falta de labels en forms", hasLabelIssue);

    // Test 9: Response structure
    console.log("\n📋 Test 9: Response structure");
    test("Respuesta tiene 'simplified_content'", Array.isArray(valid.body.simplified_content));
    test("Respuesta tiene 'navigation_steps'", Array.isArray(valid.body.navigation_steps));
    test("Respuesta tiene 'confidence'", typeof valid.body.confidence === "number");

    // Test 10: Confidence range
    console.log("\n📋 Test 10: Confidence scoring");
    test("Confidence es número", typeof valid.body.confidence === "number");
    test("Confidence entre 0-1", valid.body.confidence >= 0 && valid.body.confidence <= 1);

    // Test 11: Large payload handling
    console.log("\n📋 Test 11: Large payload (edge case)");
    const largePayload = {
      page: {
        title: "Large Page",
        headings: Array(100).fill("Heading"),
        paragraphs: Array(1000).fill("Large paragraph text"),
        links: Array(500).fill({ text: "Link", href: "#" }),
        images: Array(500).fill({ src: "img.jpg", alt: "image" }),
        forms: Array(100).fill({ name: "field", label: "Field" })
      }
    };
    const largeTest = await makeRequest("POST", "/analyze", largePayload);
    test("Acepta payload grande", largeTest.statusCode === 200);

    // Test 12: Issue severity levels
    console.log("\n📋 Test 12: Issue severity validation");
    const severities = valid.body.issues.map((i) => i.severity);
    const validSeverities = severities.every((s) =>
      ["low", "medium", "high"].includes(s)
    );
    test("Issues tienen severidad válida", validSeverities);
  } catch (error) {
    criticalFailure = true;
    failCount++;
    console.error("❌ Error crítico:", error.message);
  } finally {
    try {
      await shutdownManagedServer();
    } catch (error) {
      criticalFailure = true;
      failCount++;
      console.error("❌ Error cerrando backend de pruebas:", error.message);
    }
  }

  // Resumen
  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESULTADOS: ${passCount} PASS, ${failCount} FAIL`);
  console.log("=".repeat(50));
  if (failCount > 0 || criticalFailure) {
    process.exit(1);
  }
}

// Ejecutar tests
runTests();
