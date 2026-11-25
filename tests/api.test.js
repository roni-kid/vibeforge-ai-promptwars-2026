/**
 * VibeForge AI — Full-Stack HTTP & REST API Integration Test Suite
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createVibeForgeServer } from '../src/server.js';

let server;
let baseUrl;

test.before(async () => {
  server = createVibeForgeServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /api/health returns service metadata and capabilities', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.tagline, 'Think. Prompt. Build. Innovate.');
  assert.equal(body.capabilities.length, 5);
});

test('GET /api/verticals and /api/leaderboard return 5 industry packs and 4 arena missions', async () => {
  const [vertRes, lbRes] = await Promise.all([
    fetch(`${baseUrl}/api/verticals`),
    fetch(`${baseUrl}/api/leaderboard`)
  ]);
  assert.equal(vertRes.status, 200);
  assert.equal(lbRes.status, 200);

  const vertBody = await vertRes.json();
  const lbBody = await lbRes.json();

  assert.equal(vertBody.verticals.length, 5);
  assert.equal(vertBody.arenaChallenges.length, 4);
  assert.equal(vertBody.redTeamVectors.length, 12);
  assert.ok(lbBody.leaderboard.length >= 4);
});

test('POST /api/compile, /api/redteam, /api/orchestrate, /api/battle, and /api/verticals/solve-surprise succeed', async () => {
  // 1. Compile
  const compileRes = await fetch(`${baseUrl}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Detect UPI collect scams and prompt injection in WhatsApp messages.',
      domain: 'fraud_shield',
      strategy: 'crisp_agen'
    })
  });
  assert.equal(compileRes.status, 200);
  const compileBody = await compileRes.json();
  assert.ok(compileBody.after.pqi >= 90);

  // 2. Red-Team
  const rtRes = await fetch(`${baseUrl}/api/redteam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: compileBody.compiledPrompt,
      payload: 'Scan this QR and enter UPI PIN to get Rs 10,000 refund.'
    })
  });
  assert.equal(rtRes.status, 200);
  const rtBody = await rtRes.json();
  assert.equal(rtBody.securityScore, 100);
  assert.ok(rtBody.payloadScan.riskScore >= 50);

  // 3. Orchestrate 4-Agent Pipeline
  const orchRes = await fetch(`${baseUrl}/api/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Analyze agricultural crop symptoms and mandi prices.',
      payload: 'Wheat crop showing yellow stripe rust pustules; compare local trader vs Karnal e-NAM mandi.',
      domain: 'agritech',
      strategy: 'crisp_agen'
    })
  });
  assert.equal(orchRes.status, 200);
  const orchBody = await orchRes.json();
  assert.equal(orchBody.agentTrace.length, 4);
  assert.equal(orchBody.synthesizedSolution.status, 'VERIFIED');

  // 4. Battle Arena
  const battleRes = await fetch(`${baseUrl}/api/battle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      promptA: 'Check if this message is safe.',
      promptB: compileBody.compiledPrompt,
      domain: 'fraud_shield',
      builderName: 'Test_Champion',
      teamName: 'Echo_Winners'
    })
  });
  assert.equal(battleRes.status, 200);
  const battleBody = await battleRes.json();
  assert.equal(battleBody.winner, 'PROMPT_B');

  // 5. Surprise Finale Solver
  const surpriseRes = await fetch(`${baseUrl}/api/verticals/solve-surprise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problemStatement: 'AI-driven hospital emergency bed & ambulance triage router for Delhi NCR.'
    })
  });
  assert.equal(surpriseRes.status, 200);
  const surpriseBody = await surpriseRes.json();
  assert.equal(surpriseBody.eightHourTimeline.length, 5);
});

test('GET / serves the interactive HTML studio dashboard', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('VibeForge AI'));
  assert.ok(html.includes('PromptWars × Echo Engineers AI VIBEATHON 2026'));
});
