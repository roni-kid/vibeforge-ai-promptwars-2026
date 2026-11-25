import { createVibeForgeServer } from '../src/server.js';

const server = createVibeForgeServer();

export default function handler(req, res) {
  return server.emit('request', req, res);
}
