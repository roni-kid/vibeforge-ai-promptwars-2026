/**
 * VibeForge AI — 6-Axis Quantitative Prompt Telemetry & Diagnostic Engine
 * Built for PromptWars x Echo Engineer's AI VIBEATHON 2026
 * Tagline: "Think. Prompt. Build. Innovate."
 */

const ROLE_PATTERNS = [
  /\byou are (a|an|the)\b/i,
  /\bact as (a|an|the)\b/i,
  /\brole\s*:/i,
  /\bsystem persona\s*:/i,
  /\bexpert in\b/i,
  /\bsenior\b.*\b(engineer|architect|analyst|specialist|doctor|clinician|auditor|advisor)\b/i,
  /<role>[\s\S]*?<\/role>/i
];

const OBJECTIVE_PATTERNS = [
  /\byour (task|goal|objective|mission) is\b/i,
  /\bobjective\s*:/i,
  /\btask\s*:/i,
  /\banalyze\b|\bsynthesize\b|\bclassify\b|\bextract\b|\bgenerate\b|\bevaluate\b|\barchitect\b|\bdiagnose\b/i,
  /<objective>[\s\S]*?<\/objective>/i
];

const STRUCTURE_PATTERNS = [
  /```(json|xml|yaml|markdown|typescript|python)/i,
  /<[a-z_]+>[\s\S]*?<\/[a-z_]+>/i,
  /^#{1,4}\s+\w+/m,
  /\b(output format|response format|schema|json schema)\s*:/i,
  /\breturn (only|strictly) (valid )?json\b/i,
  /\bstep\s*1\b[\s\S]*?\bstep\s*2\b/i
];

const REASONING_PATTERNS = [
  /\bstep[- ]by[- ]step\b/i,
  /\bchain[- ]of[- ]thought\b/i,
  /\bthink (carefully|before|through)\b/i,
  /\breasoning (process|steps|chain|scratchpad)\b/i,
  /\bself[- ](critique|verify|check|reflect)\b/i,
  /\bedge cases?\b/i,
  /\bfirst,[\s\S]*?second,[\s\S]*?(third|finally)/i,
  /<reasoning>[\s\S]*?<\/reasoning>/i
];

const GROUNDING_PATTERNS = [
  /\{\{[a-zA-Z0-9_.-]+\}\}|\{[a-zA-Z0-9_]+\}|\$\{[a-zA-Z0-9_]+\}/,
  /\bexample\s*\d*\s*:/i,
  /\bfew[- ]shot\b/i,
  /\binput\s*:[\s\S]*?\boutput\s*:/i,
  /\bconstraints?\s*:/i,
  /\bdo not\b|\bnever\b|\bmust not\b|\bavoid\b/i,
  /<examples?>[\s\S]*?<\/examples?>/i,
  /<context>[\s\S]*?<\/context>/i
];

const SAFETY_PATTERNS = [
  /\bignore (any )?(attempts|instructions) to (override|bypass|ignore)\b/i,
  /\bprompt injection\b|\bहालांकि\b|\badversarial\b|\buntrusted (input|data)\b/i,
  /\bif (unsure|uncertain|insufficient|unverified)\b/i,
  /\bdo not (hallucinate|fabricate|invent|guess|reveal system)\b/i,
  /\bpii\b|\bredact\b|\bsanitize\b|\bconfidential\b/i,
  /<guardrails?>[\s\S]*?<\/guardrails?>/i,
  /\btreat [\s\S]*? as data, not instructions\b/i
];

const VAGUE_PENALTY_PATTERNS = [
  { regex: /\bmake it good\b/i, label: 'Vague quality directive ("make it good")' },
  { regex: /\bdo your best\b/i, label: 'Non-deterministic filler ("do your best")' },
  { regex: /\betc\.?\b/i, label: 'Open-ended enumeration ("etc.") reduces output determinism' },
  { regex: /\bsomething like\b/i, label: 'Ambiguous target ("something like")' },
  { regex: /\bas much as possible\b/i, label: 'Unbounded scope ("as much as possible")' },
  { regex: /^(write|make|create|tell me about)\s+\w+(\s+\w+){0,5}\.?$/i, label: 'Single-sentence under-specified zero-shot prompt' }
];

/**
 * Approximates token count using word/punctuation segmentation (~0.75 words/token)
 */
export function estimateTokens(text = '') {
  const cleaned = String(text).trim();
  if (!cleaned) return 0;
  const words = cleaned.split(/\s+/).length;
  const symbols = (cleaned.match(/[{}[\]()<>:;,.!?'"`~@#$%^&*+=|\\/-]/g) || []).length;
  return Math.max(1, Math.ceil(words * 1.28 + symbols * 0.35));
}

function countPatternMatches(text, patterns) {
  return patterns.reduce((acc, regex) => acc + (regex.test(text) ? 1 : 0), 0);
}

/**
 * Evaluates a prompt across 6 quantitative dimensions and returns full telemetry.
 */
export function analyzePrompt(rawPrompt = '', domain = 'general') {
  const text = String(rawPrompt || '').trim();
  const tokens = estimateTokens(text);
  const charCount = text.length;
  const lineCount = text ? text.split(/\r?\n/).length : 0;

  if (!text) {
    return {
      prompt: '',
      domain,
      tokens: 0,
      charCount: 0,
      lineCount: 0,
      pqi: 0,
      grade: 'F',
      tier: 'Unconfigured',
      axes: {
        clarity: 0,
        structure: 0,
        reasoning: 0,
        grounding: 0,
        safety: 0,
        efficiency: 0
      },
      diagnostics: [
        {
          severity: 'critical',
          axis: 'clarity',
          title: 'Empty Prompt Payload',
          detail: 'Provide an intent, problem statement, or draft prompt to analyze.'
        }
      ],
      detectedElements: [],
      missingElements: [
        'System Persona / Role Anchor',
        'Explicit Task Objective',
        'Structured Output Contract (JSON/Schema)',
        'Chain-of-Thought Reasoning Step',
        'Few-Shot Exemplars & Variable Bindings',
        'Anti-Hallucination & Injection Guardrails'
      ]
    };
  }

  const roleMatches = countPatternMatches(text, ROLE_PATTERNS);
  const objectiveMatches = countPatternMatches(text, OBJECTIVE_PATTERNS);
  const structureMatches = countPatternMatches(text, STRUCTURE_PATTERNS);
  const reasoningMatches = countPatternMatches(text, REASONING_PATTERNS);
  const groundingMatches = countPatternMatches(text, GROUNDING_PATTERNS);
  const safetyMatches = countPatternMatches(text, SAFETY_PATTERNS);

  const vagueHits = VAGUE_PENALTY_PATTERNS.filter((p) => p.regex.test(text));
  const vaguePenalty = vagueHits.length * 8;

  // 1. Clarity & Role Specificity (0-100)
  let clarity = 22;
  clarity += Math.min(35, roleMatches * 18);
  clarity += Math.min(35, objectiveMatches * 14);
  if (tokens >= 25 && tokens <= 900) clarity += 10;
  clarity = Math.max(8, Math.min(100, clarity - vaguePenalty));

  // 2. Structural & Schema Determinism (0-100)
  let structure = 15;
  structure += Math.min(60, structureMatches * 16);
  if (lineCount >= 5) structure += 12;
  if (lineCount >= 12) structure += 13;
  structure = Math.max(5, Math.min(100, structure));

  // 3. Reasoning Depth (0-100)
  let reasoning = 12;
  reasoning += Math.min(72, reasoningMatches * 20);
  if (/\b(verify|validate|confidence|rationale|evidence)\b/i.test(text)) reasoning += 16;
  reasoning = Math.max(5, Math.min(100, reasoning));

  // 4. Context & Few-Shot Grounding (0-100)
  let grounding = 14;
  grounding += Math.min(70, groundingMatches * 16);
  if (/\b(source|citation|reference|context|dataset)\b/i.test(text)) grounding += 16;
  grounding = Math.max(5, Math.min(100, grounding));

  // 5. Adversarial & Hallucination Resilience (0-100)
  let safety = 10;
  safety += Math.min(75, safetyMatches * 20);
  if (/<[a-z_]+>/i.test(text) && /\b(untrusted|delimit|boundary|data)\b/i.test(text)) safety += 15;
  safety = Math.max(5, Math.min(100, safety));

  // 6. Token & Latency Efficiency (0-100)
  const structuralDensity =
    (roleMatches + objectiveMatches + structureMatches + reasoningMatches + groundingMatches + safetyMatches) /
    Math.max(1, tokens / 45);
  let efficiency = 48 + Math.min(44, Math.round(structuralDensity * 14)) - vagueHits.length * 7;
  if (tokens < 12) efficiency = Math.min(efficiency, 35); // Too terse to be deterministic
  if (tokens > 1800) efficiency -= 15; // Bloated prompt penalty
  efficiency = Math.max(15, Math.min(99, efficiency));

  // Composite Prompt Quality Index (PQI)
  const pqi = Math.round(
    clarity * 0.20 +
      structure * 0.20 +
      reasoning * 0.18 +
      grounding * 0.17 +
      safety * 0.15 +
      efficiency * 0.10
  );

  let grade = 'D';
  let tier = 'Draft Zero-Shot';
  if (pqi >= 90) {
    grade = 'A+';
    tier = 'Grandmaster Agentic Spec';
  } else if (pqi >= 80) {
    grade = 'A';
    tier = 'Production Hardened';
  } else if (pqi >= 68) {
    grade = 'B';
    tier = 'Structured Prompt';
  } else if (pqi >= 50) {
    grade = 'C';
    tier = 'Intermediate Draft';
  }

  const detectedElements = [];
  const missingElements = [];

  if (roleMatches > 0) detectedElements.push('System Persona / Role Anchor');
  else missingElements.push('System Persona / Role Anchor');

  if (objectiveMatches > 0) detectedElements.push('Explicit Task Objective');
  else missingElements.push('Explicit Task Objective');

  if (structureMatches >= 2) detectedElements.push('Structured Output Contract (JSON/XML)');
  else missingElements.push('Structured Output Contract (JSON/XML)');

  if (reasoningMatches > 0) detectedElements.push('Chain-of-Thought / Verification Loop');
  else missingElements.push('Chain-of-Thought / Verification Loop');

  if (groundingMatches >= 2) detectedElements.push('Context Variables & Few-Shot Constraints');
  else missingElements.push('Context Variables & Few-Shot Constraints');

  if (safetyMatches > 0) detectedElements.push('Adversarial & Hallucination Guardrails');
  else missingElements.push('Adversarial & Hallucination Guardrails');

  const diagnostics = [];

  if (roleMatches === 0) {
    diagnostics.push({
      severity: 'warning',
      axis: 'clarity',
      title: 'Missing System Persona Anchor',
      detail: 'Define an explicit domain persona (e.g., <role>Senior AI Security Architect</role>) to constrain latent vocabulary and reasoning depth.'
    });
  }
  if (structureMatches < 2) {
    diagnostics.push({
      severity: 'critical',
      axis: 'structure',
      title: 'Unconstrained Output Schema',
      detail: 'No strict JSON Schema or XML/Markdown contract found. Downstream parsers or UI components may crash on free-form prose.'
    });
  }
  if (reasoningMatches === 0) {
    diagnostics.push({
      severity: 'warning',
      axis: 'reasoning',
      title: 'No Explicit Reasoning Scratchpad',
      detail: 'Add a mandatory step-by-step reasoning or self-critique phase before emitting final conclusions.'
    });
  }
  if (groundingMatches < 2) {
    diagnostics.push({
      severity: 'optimization',
      axis: 'grounding',
      title: 'Low Few-Shot & Variable Grounding',
      detail: 'Bind dynamic inputs inside XML tags (e.g., <user_input>{{payload}}</user_input>) and provide at least 1 canonical input/output example.'
    });
  }
  if (safetyMatches === 0) {
    diagnostics.push({
      severity: 'critical',
      axis: 'safety',
      title: 'Vulnerable to Prompt Injection & Hallucination',
      detail: 'Prompt lacks instruction-data boundary enforcement and epistemic uncertainty rules ("If unverified, return INSUFFICIENT_EVIDENCE").'
    });
  }
  for (const hit of vagueHits) {
    diagnostics.push({
      severity: 'optimization',
      axis: 'efficiency',
      title: 'Ambiguous Phrase Detected',
      detail: hit.label
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      severity: 'success',
      axis: 'all',
      title: 'Production-Ready Prompt Architecture',
      detail: 'All 6 telemetry dimensions meet enterprise determinism, schema, and safety thresholds.'
    });
  }

  // Cost and latency estimates across flagship models
  const modelEstimates = {
    'gemini-2.5-flash': {
      estimatedLatencyMs: Math.round(320 + tokens * 0.45),
      costPer1kRunsUsd: Number(((tokens * 0.00015) + 0.12).toFixed(4))
    },
    'gemini-2.5-pro': {
      estimatedLatencyMs: Math.round(680 + tokens * 0.95),
      costPer1kRunsUsd: Number(((tokens * 0.00125) + 0.85).toFixed(4))
    }
  };

  return {
    prompt: text,
    domain,
    tokens,
    charCount,
    lineCount,
    pqi,
    grade,
    tier,
    axes: {
      clarity,
      structure,
      reasoning,
      grounding,
      safety,
      efficiency
    },
    diagnostics,
    detectedElements,
    missingElements,
    modelEstimates
  };
}
