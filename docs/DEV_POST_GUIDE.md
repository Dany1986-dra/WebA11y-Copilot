# Guia para publicar en Dev.to

Usa la plantilla oficial de "Build With Gemma 4".

## Secciones obligatorias

1. `What I Built`
2. `Demo`
3. `Code`
4. `How I Used Gemma 4`

## Checklist antes de publicar

- [ ] Video de demo funcionando
- [ ] Repo GitHub publico
- [ ] Tags: `devchallenge, gemmachallenge, gemma`
- [ ] Explicar modelo elegido (31B Dense) y razon
- [ ] Mostrar que Gemma hace trabajo real

## Texto corto recomendado (How I Used Gemma 4)

Gemma 4 is the core reasoning engine of WebA11y Copilot.  
Deterministic WCAG checks detect objective issues, while Gemma 4 provides contextual simplification and step-by-step guidance for users with reading and cognitive accessibility needs.
# Post para Dev.to - WebA11y Copilot

## Estructura Sugerida

### Título
```
Building a Web Accessibility Auditor with Gemma 4: Why I Chose the 31B Model
```

### Párrafo de Apertura
Hace 1 de cada 4 personas online tiene una discapacidad. Las herramientas que usamos para auditar accesibilidad suelen ser caras o cerradas. **¿Y si pudiera auditar páginas web con IA local y gratis?**

Presentamos **WebA11y Copilot**: una herramienta que combina reglas WCAG deterministas con **Gemma 4 31B** para detectar barreras de accesibilidad, simplificar contenido y generar guías de navegación.

## Secciones Clave

### 1. "The Problem: Web Accessibility Needs AI"
- 96% de sitios web tienen errores de accesibilidad (WebAIM)
- Herramientas existentes: Axe ($), Lighthouse (solo métricas), NVDA (manual)
- **Oportunidad**: IA para explicar *por qué* hay problemas y *cómo* arreglarlos

### 2. "Why Gemma 4 31B Specifically?" ⭐ IMPORTANTE PARA GANAR

**Este es el punto que los jueces quieren ver.**

```markdown
I evaluated three approaches:

**Option 1: Gemma 4 2B-IT (Edge Model)**
- ❌ Too limited for multi-step reasoning (WCAG + content simplification)
- ❌ Cannot explain accessibility fixes in context
- ✅ Great for fast inference

**Option 2: Gemma 4 27B MoE (Mixture of Experts)**
- ✅ Fast and efficient
- ❌ Inconsistent routing for complex accessibility analysis
- ❌ Overkill for single-task reasoning

**Option 3: Gemma 4 31B-IT (Dense Model) — THE WINNER**
- ✅ 128K context window (analyze full pages)
- ✅ Strong at multi-step reasoning (WCAG rules + AI insights)
- ✅ Balanced performance (runs locally or via API)
- ✅ Free tier available (Google AI Studio, OpenRouter)
- ✅ Deterministic enough for structured JSON output
```

### 3. "How It Works"
```markdown
## The Architecture

1. **Frontend (Accessible by Design)**
   - Skip links, ARIA labels, semantic HTML
   - User pastes website structure as JSON

2. **Rule Engine**
   - WCAG 2.2 rules: headings, alt text, labels, link text
   - Deterministic, offline validation

3. **Gemma 4 Layer**
   - Analyzes why each issue matters for specific disabilities
   - Suggests fixes with implementation examples
   - Simplifies complex content for cognitive overload
   - Generates step-by-step navigation guides

4. **Structured Output**
   - Issues with severity + fix
   - Simplified versions of text
   - Navigation steps
   - Confidence score
```

### 4. "Getting Started (5 minutes)"
```bash
# Clone & install
git clone [your-repo]
cd weba11y-copilot
npm install

# Get FREE Gemma 4 API key
# Option A: Google AI Studio (https://ai.google.dev)
# Option B: OpenRouter (https://openrouter.ai)

echo "GOOGLE_API_KEY=your_key" > .env
npm start

# Open http://localhost:5500 (Live Server)
```

### 5. "Real Example: Analyzing a Broken Accessibility Pattern"
- Usa mock-analysis.json como ejemplo
- Muestra issues detectadas antes y después de Gemma 4
- Ejemplo: "Link text 'Click here' → 'Gemma explains this is ambiguous for screen reader users, suggest 'Download Q3 Report (PDF, 2MB)' instead"

### 6. "Why This Matters"
- Accesibilidad = inclusión + SEO + legal compliance
- Gemma 4 = análisis + educación (no solo reporting)
- Local + Open = privacidad + costo cero

### 7. "Next Steps & Challenges"
- Multimodal: analizar screenshots directamente
- Fine-tuning: entrenar Gemma 4 con dataset WCAG específico
- Mobile: ejecutar Gemma 4 2B en el navegador

## Consejos para Ganar

✅ **Resalta la elección intencional de Gemma 4 31B** - esto es lo que buscan los jueces
✅ **Muestra código real** - links a GitHub
✅ **Demo en vivo** - screenshot o video GIF de la herramienta funcionando
✅ **Comparte learning**: "Por qué no elegí Gemma 3" + "Por qué no usé solo reglas"
✅ **SEO**: tags → #gemma #webdev #accessibility #ai #openmodels

## Tags para Dev.to
```
#gemma #gemmachallenge #accessibility #webdev #ai #openai #nodeJS #webstandards
```

## Checklist Antes de Publicar
- [ ] .env.example está actualizado
- [ ] README.md explica por qué Gemma 4 31B
- [ ] Código está limpio y comentado
- [ ] Link a GitHub está listo
- [ ] Has probado el ejemplo con "Load example"
- [ ] Redacción sin errores gramaticales

---

**Nota:** Sigue este plan para maximizar oportunidades de ganar en el desafío Gemma 4.
