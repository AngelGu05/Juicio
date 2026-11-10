// Servidor del modo en línea: sirve la página y mantiene las salas por WebSocket.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const Game = require('./public/game.js');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };
const SKELETON = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style></head><body>';

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(PUB, path.normalize(p));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': (TYPES[ext] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-cache' });
    if (p === '/index.html') res.end(SKELETON + buf.toString() + '</body></html>');
    else res.end(buf);
  });
});

const rooms = new Map(); // código -> { state, socks: Map(pid -> ws), emptySince }
const newCode = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c; do { c = Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join(''); } while (rooms.has(c));
  return c;
};
const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
function broadcast(room, fx) {
  for (const [pid, ws] of room.socks) {
    send(ws, { t: 'state', s: Game.view(room.state, pid) });
    if (fx && fx.length) send(ws, { t: 'fx', fx });
  }
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 600 * 1024 });
wss.on('connection', ws => {
  let room = null, pid = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'join') {
      if (room) return;
      let code = String(m.code || '').toUpperCase().trim();
      if (!code) { code = newCode(); rooms.set(code, { state: Game.newState(code, 'online'), socks: new Map(), emptySince: 0 }); }
      const r = rooms.get(code);
      if (!r) return send(ws, { t: 'err', m: 'No existe una sala con ese código.', fatal: true });
      pid = /^[a-z0-9]{6,20}$/.test(m.pid || '') ? m.pid : Math.random().toString(36).slice(2, 12);
      room = r;
      const old = room.socks.get(pid); if (old && old !== ws) old.close();
      room.socks.set(pid, ws); room.emptySince = 0;
      const known = !!room.state.players[pid];
      Game.addPlayer(room.state, pid, m.name);
      if (!known && m.acc) Game.act(room.state, pid, { type: 'setAcc', acc: m.acc });
      send(ws, { t: 'joined', code, pid });
      broadcast(room);
    } else if (m.t === 'act' && room) {
      const r = Game.act(room.state, pid, m.a || {});
      if (r.err) send(ws, { t: 'err', m: r.err }); else broadcast(room, r.fx);
    }
  });
  ws.on('close', () => {
    if (!room || room.socks.get(pid) !== ws) return;
    room.socks.delete(pid);
    const s = room.state, p = s.players[pid];
    if (p) {
      p.on = false;
      // En la sala de espera, quien se va libera su lugar.
      if (s.phase === 'lobby') { delete s.players[pid]; s.order = s.order.filter(x => x !== pid); }
      if (s.hostId === pid) { const n = Game.list(s).find(x => x.on); if (n) s.hostId = n.id; }
    }
    if (!room.socks.size) room.emptySince = Date.now(); else broadcast(room);
  });
});

// Las salas vacías se borran a los 30 minutos.
setInterval(() => {
  for (const [c, r] of rooms) if (r.emptySince && Date.now() - r.emptySince > 30 * 60000) rooms.delete(c);
}, 60000);

server.listen(PORT, () => console.log('Con Todo Respeto, Su Señoría — http://localhost:' + PORT));
