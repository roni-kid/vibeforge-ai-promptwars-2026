/**
 * VibeForge AI — Zero-Fragility Full-Stack HTTP & REST API Server
 * Built for PromptWars x Echo Engineer's AI VIBEATHON 2026
 * Tagline: "Think. Prompt. Build. Innovate."
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzePrompt } from './engine/promptAnalyzer.js';
import { compilePrompt } from './engine/promptCompiler.js';
import { runRedTeamAudit, analyzeLiveThreatPayload, RED_TEAM_VECTORS } from './engine/redTeamScanner.js';
import { ARENA_CHALLENGES, runPromptBattle } from './engine/battleArena.js';
import { VERTICAL_PACKS, solveSurpriseProblemStatement } from './engine/verticalPacks.js';
import { executeMultiAgentPipeline } from './engine/agentOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// In-memory live leaderboard seeded with PromptWars x Echo Engineers benchmarks
const LEADERBOARD = [
  {
    rank: 1,
    builder: 'VibeForge_Autonomous_Core',
    team: 'PromptWars Grandmaster',
    track: 'FraudShield & Multi-Agent Studio',
    bestPqi: 97,
    securityScore: 100,
    promptCredits: 1840,
    badge: 'Grandmaster Architect'
  },
  {
    rank: 2,
    builder: 'Aryan_EchoLab',
    team: 'Echo Engineers Noida',
    track: 'MedTriage Clinical AI',
    bestPqi: 91,
    securityScore: 92,
    promptCredits: 1490,
    badge: 'Red-Team Sentinel'
  },
  {
    rank: 3,
    builder: 'KisanVibe_Builder',
    team: 'AgriStack Delhi NCR',
    track: 'KisanVibe Rural Copilot',
    bestPqi: 89,
    securityScore: 83,
    promptCredits: 1320,
    badge: 'Impact Pioneer'
  },
  {
    rank: 4,
    builder: 'Socratic_Dev',
    team: 'CampusPulse AI',
    track: 'EdTech Socratic Mentor',
    bestPqi: 86,
    securityScore: 83,
    promptCredits: 1185,
    badge: 'Schema Specialist'
  }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Gemini-Api-Key'
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

export function createVibeForgeServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Gemini-Api-Key'
        });
        return res.end();
      }

      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      // API ROUTES
      if (pathname === '/api/health' && req.method === 'GET') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'VibeForge AI — PromptWars x Echo Engineer’s AI VIBEATHON 2026',
          tagline: 'Think. Prompt. Build. Innovate.',
          version: '2.0.0',
          geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
          capabilities: [
            '6-Axis Quantitative Prompt Telemetry (PQI)',
            'CRISP-AGEN / DSPy / CoT / VibeCode Multi-Strategy Prompt Compiler',
            '12-Vector Adversarial Red-Team & FraudShield Security Scanner',
            '4-Agent Autonomous Execution Pipeline + Live Gemini 2.5 Flash Bridge',
            'PromptWars Head-to-Head A/B Battle Arena & 5 Industry Vertical Packs'
          ]
        });
      }

      if (pathname === '/api/verticals' && req.method === 'GET') {
        return sendJson(res, 200, {
          verticals: VERTICAL_PACKS,
          arenaChallenges: ARENA_CHALLENGES,
          redTeamVectors: RED_TEAM_VECTORS.map(({ id, category, name, severity, attackPayload, remediation }) => ({
            id,
            category,
            name,
            severity,
            attackPayload,
            remediation
          }))
        });
      }

      if (pathname === '/api/leaderboard' && req.method === 'GET') {
        return sendJson(res, 200, { leaderboard: LEADERBOARD });
      }

      if (pathname === '/api/analyze' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = analyzePrompt(body.prompt || '', body.domain || 'general');
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/compile' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = compilePrompt({
          rawPrompt: body.prompt || '',
          domain: body.domain || 'general',
          strategy: body.strategy || 'crisp_agen',
          outputFormat: body.outputFormat || 'json',
          strictSafety: body.strictSafety !== false
        });
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/redteam' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const audit = runRedTeamAudit(body.prompt || '');
        const payloadScan = body.payload ? analyzeLiveThreatPayload(body.payload) : audit.liveThreatAnalysis;
        return sendJson(res, 200, {
          ...audit,
          payloadScan
        });
      }

      if (pathname === '/api/orchestrate' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const headerKey = req.headers['x-gemini-api-key'] || '';
        const result = await executeMultiAgentPipeline({
          rawPrompt: body.prompt || '',
          userPayload: body.payload || '',
          domain: body.domain || 'general',
          strategy: body.strategy || 'crisp_agen',
          apiKey: body.apiKey || headerKey
        });
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/battle' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = runPromptBattle({
          promptA: body.promptA || '',
          promptB: body.promptB || '',
          domain: body.domain || 'general',
          missionId: body.missionId || 'custom'
        });

        if (body.builderName) {
          const topScore = Math.max(result.contenderA.pqi, result.challengerB.pqi);
          const topSec = Math.max(result.contenderA.securityScore, result.challengerB.securityScore);
          LEADERBOARD.push({
            rank: LEADERBOARD.length + 1,
            builder: String(body.builderName).slice(0, 32),
            team: String(body.teamName || 'AI Vibeathon Challenger').slice(0, 36),
            track: result.domain,
            bestPqi: topScore,
            securityScore: topSec,
            promptCredits: 1000 + result.creditsEarned,
            badge: topScore >= 90 ? 'Grandmaster Challenger' : 'Vibe Coder'
          });
          LEADERBOARD.sort((a, b) => b.promptCredits - a.promptCredits);
          LEADERBOARD.forEach((item, idx) => {
            item.rank = idx + 1;
          });
        }

        return sendJson(res, 200, {
          ...result,
          leaderboard: LEADERBOARD.slice(0, 10)
        });
      }

      if (pathname === '/api/verticals/solve-surprise' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = solveSurpriseProblemStatement({
          problemStatement: body.problemStatement || '',
          trackDomain: body.domain || 'vibecoder',
          teamName: body.teamName || 'Team VibeForge'
        });
        return sendJson(res, 200, result);
      }

      // STATIC FRONTEND SERVING
      let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
      // Prevent directory traversal
      if (!filePath.startsWith(PUBLIC_DIR)) {
        return sendJson(res, 403, { error: 'Forbidden' });
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(PUBLIC_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      sendJson(res, 400, {
        error: err.message || 'Internal Server Error'
      });
    }
  });
}

// Start server if invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const PORT = Number(process.env.PORT || 3000);
  const server = createVibeForgeServer();
  server.listen(PORT, () => {
    console.log(`\n==================================================================`);
    console.log(`🚀 VibeForge AI Studio — PromptWars x AI VIBEATHON 2026`);
    console.log(`   "Think. Prompt. Build. Innovate."`);
    console.log(`   Local URL: http://localhost:${PORT}`);
    console.log(`   Health API: http://localhost:${PORT}/api/health`);
    console.log(`==================================================================\n`);
  });
}
