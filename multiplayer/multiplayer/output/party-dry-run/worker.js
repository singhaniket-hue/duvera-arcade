var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../games/four/rules.mjs
var emptyBoard = /* @__PURE__ */ __name(() => Array(42).fill(0), "emptyBoard");
function result(board) {
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const cells = Array.from({ length: 4 }, (_, i) => [r + i * dy, c + i * dx]);
    if (cells.every(([y, x]) => y >= 0 && y < 6 && x >= 0 && x < 7) && board[r * 7 + c] && cells.every(([y, x]) => board[y * 7 + x] === board[r * 7 + c])) return { winner: board[r * 7 + c], cells: cells.map(([y, x]) => y * 7 + x) };
  }
  return board.every(Boolean) ? { winner: 0, draw: true, cells: [] } : null;
}
__name(result, "result");
function move(board, column, player) {
  if (!Number.isInteger(column) || column < 0 || column > 6 || ![1, 2].includes(player) || board[column] || result(board)) return null;
  const next = [...board];
  for (let r = 5; r >= 0; r--) if (!next[r * 7 + column]) {
    next[r * 7 + column] = player;
    return next;
  }
  return null;
}
__name(move, "move");

// draw-words.json
var draw_words_default = {
  english: [
    { word: "cat", aliases: ["kitty"] },
    { word: "bicycle", aliases: ["bike"] },
    { word: "umbrella", aliases: [] },
    { word: "pizza", aliases: [] },
    { word: "guitar", aliases: [] },
    { word: "castle", aliases: [] },
    { word: "rocket", aliases: ["rocket ship"] },
    { word: "sunflower", aliases: [] },
    { word: "keyboard", aliases: [] },
    { word: "controller", aliases: ["gamepad", "game controller"] },
    { word: "treasure chest", aliases: ["treasure"] },
    { word: "sword", aliases: [] },
    { word: "shield", aliases: [] },
    { word: "headphones", aliases: ["headset"] },
    { word: "joystick", aliases: [] },
    { word: "dragon", aliases: [] },
    { word: "robot", aliases: [] },
    { word: "ghost", aliases: [] },
    { word: "tent", aliases: [] },
    { word: "ice cream", aliases: ["icecream"] },
    { word: "rainbow", aliases: [] },
    { word: "train", aliases: [] },
    { word: "butterfly", aliases: [] },
    { word: "crown", aliases: [] }
  ],
  hindi: [
    { word: "billi", aliases: ["cat"] },
    { word: "ghar", aliases: ["house", "home"] },
    { word: "ped", aliases: ["tree", "per"] },
    { word: "suraj", aliases: ["sun", "sooraj"] },
    { word: "chaand", aliases: ["chand", "moon"] },
    { word: "chhatri", aliases: ["chatri", "umbrella"] },
    { word: "patang", aliases: ["kite"] },
    { word: "machhli", aliases: ["machli", "fish"] },
    { word: "haathi", aliases: ["hathi", "elephant"] },
    { word: "phool", aliases: ["flower", "phul"] },
    { word: "aam", aliases: ["mango"] },
    { word: "kursi", aliases: ["chair"] },
    { word: "kitab", aliases: ["kitaab", "book"] },
    { word: "chashma", aliases: ["glasses", "spectacles"] },
    { word: "naav", aliases: ["nav", "boat"] },
    { word: "pahaad", aliases: ["pahad", "mountain"] },
    { word: "taala", aliases: ["tala", "lock"] },
    { word: "taara", aliases: ["tara", "star"] },
    { word: "gaadi", aliases: ["gadi", "car"] },
    { word: "ghadi", aliases: ["clock", "watch"] },
    { word: "joota", aliases: ["juta", "shoe"] },
    { word: "badal", aliases: ["baadal", "cloud"] },
    { word: "talwar", aliases: ["sword"] },
    { word: "dhaal", aliases: ["dhal", "shield"] }
  ]
};

// quiz-questions.json
var quiz_questions_default = [
  { id: "craft-table", question: "How many wooden planks make a Minecraft crafting table?", options: ["Four", "Two", "Six", "Nine"], correct: 0, explanation: "The recipe fills the four slots of the inventory crafting grid with planks.", source: "https://www.minecraft.net/en-us/article/how-craft" },
  { id: "ore-tool", question: "Which tool is used to mine ore in Minecraft?", options: ["Pickaxe", "Fishing rod", "Shears", "Hoe"], correct: 0, explanation: "Mining ore uses a pickaxe; the required material depends on the ore.", source: "https://www.minecraft.net/en-us/article/how-craft" },
  { id: "tetris-shapes", question: "How many distinct piece shapes make up the classic Tetris set?", options: ["Seven", "Five", "Eight", "Ten"], correct: 0, explanation: "The classic set contains seven distinct shapes.", source: "https://play.tetris.com/about" },
  { id: "tetris-squares", question: "How many squares form a standard Tetris piece?", options: ["Four", "Three", "Five", "Six"], correct: 0, explanation: "Each of the seven standard pieces is built from four squares.", source: "https://play.tetris.com/about" },
  { id: "crew-tasks", question: "In classic Among Us, which group can win by completing the group's tasks?", options: ["Crewmates", "Impostors", "Spectators", "Neither group"], correct: 0, explanation: "Task completion is one of the Crewmates' routes to victory.", source: "https://www.innersloth.com/games/among-us/" },
  { id: "impostor-disguise", question: "Why might an Impostor pretend to do tasks in Among Us?", options: ["To blend in with Crewmates", "To earn a crafting recipe", "To clear a Tetris line", "To restore a chess piece"], correct: 0, explanation: "Pretending to work on tasks helps an Impostor maintain the disguise.", source: "https://www.innersloth.com/games/among-us/" },
  { id: "bishop-path", question: "On an otherwise clear chessboard, which paths can a bishop follow?", options: ["Diagonals", "Ranks only", "Files only", "Knight-shaped jumps"], correct: 0, explanation: "A bishop travels along diagonals and cannot pass through another piece.", source: "https://handbook.fide.com/chapter/e012023" },
  { id: "rook-path", question: "On an otherwise clear chessboard, which paths can a rook follow?", options: ["Ranks and files", "Diagonals only", "Only one square diagonally", "Knight-shaped jumps"], correct: 0, explanation: "A rook moves along its rank or file, without passing through pieces.", source: "https://handbook.fide.com/chapter/e012023" },
  { id: "queen-path", question: "Which chess piece combines a rook's and bishop's ordinary movement directions?", options: ["Queen", "Pawn", "Knight", "King"], correct: 0, explanation: "The queen can move along ranks, files and diagonals.", source: "https://handbook.fide.com/chapter/e012023" },
  { id: "knight-path", question: "Which chess piece makes the familiar L-shaped move?", options: ["Knight", "Bishop", "Rook", "Queen"], correct: 0, explanation: "A knight moves two squares along one axis and one along the other.", source: "https://handbook.fide.com/chapter/e012023" }
];

// quiz-core.mjs
function validateQuestions(pack) {
  if (!Array.isArray(pack) || pack.length < 10) throw Error("Need ten questions.");
  const ids = /* @__PURE__ */ new Set();
  for (const q of pack) {
    if (!q || typeof q.id !== "string" || ids.has(q.id) || typeof q.question !== "string" || !q.question.trim() || q.options?.length !== 4 || new Set(q.options).size !== 4 || q.options.some((x) => typeof x !== "string" || !x.trim()) || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || !q.explanation || !q.source?.startsWith("https://")) throw Error("Invalid question.");
    ids.add(q.id);
  }
  return true;
}
__name(validateQuestions, "validateQuestions");
validateQuestions(quiz_questions_default);
var shuffled = /* @__PURE__ */ __name((a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}, "shuffled");
function startQuiz(r, now) {
  if (r.players.filter((p) => p.offline === null).length < 2) throw Error("Quiz needs 2 connected players.");
  r.players.forEach((p) => p.score = 0);
  r.quiz = shuffled(quiz_questions_default).slice(0, 10).map((q) => {
    const order = shuffled([0, 1, 2, 3]);
    return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
  });
  r.round = 0;
  r.total = 10;
  r.locked = true;
  r.feed = [];
  nextQuiz(r, now);
}
__name(startQuiz, "startQuiz");
function nextQuiz(r, now) {
  if (r.round >= 10) {
    r.phase = "finished";
    r.deadline = 0;
    return;
  }
  r.round++;
  r.roundId = crypto.randomUUID();
  r.answers = {};
  r.phase = "question";
  r.started = now;
  r.deadline = now + 2e4;
  r.eligible = r.players.filter((p) => p.offline === null).map((p) => p.id);
}
__name(nextQuiz, "nextQuiz");
function closeQuiz(r) {
  const q = r.quiz[r.round - 1];
  for (const p of r.players) {
    const a = r.answers[p.id];
    if (a?.choice === q.correct) p.score += 500 + Math.floor(500 * Math.max(0, 2e4 - a.elapsed) / 2e4);
  }
  r.phase = r.round === 10 ? "finished" : "quizReveal";
  r.deadline = 0;
}
__name(closeQuiz, "closeQuiz");
function quizAction(r, p, m, now) {
  if (m.roundId !== r.roundId) throw Error("This question has closed or changed.");
  if (m.type === "next") {
    if (p.id !== r.host) throw Error("Only the host can do that.");
    if (r.phase !== "quizReveal") throw Error("Wait until this question closes.");
    if (r.players.filter((p2) => p2.offline === null).length < 2) throw Error("Wait for 2 connected players.");
    nextQuiz(r, now);
    return;
  }
  if (m.type !== "answer") throw Error("Unknown quiz command.");
  if (r.phase !== "question" || m.roundId !== r.roundId) throw Error("This question has closed or changed.");
  if (!r.eligible.includes(p.id)) throw Error("Join the next question.");
  if (r.answers[p.id]) throw Error("Your answer is already locked.");
  if (!Number.isInteger(m.choice) || m.choice < 0 || m.choice > 3) throw Error("Choose one of the four answers.");
  r.answers[p.id] = { choice: m.choice, elapsed: Math.max(0, now - r.started) };
  if (r.eligible.every((id) => r.answers[id] || !r.players.some((p2) => p2.id === id))) closeQuiz(r);
}
__name(quizAction, "quizAction");
function quizSnapshot(r, id) {
  const q = r.quiz?.[r.round - 1];
  if (!q) return {};
  const closed = r.phase === "quizReveal" || r.phase === "finished";
  return { question: { text: q.question, options: q.options, ...closed ? { correct: q.correct, explanation: q.explanation, source: q.source } : {} }, selection: r.answers[id]?.choice ?? null, answered: Object.keys(r.answers), eligible: r.eligible };
}
__name(quizSnapshot, "quizSnapshot");

// party-core.mjs
var COLORS = ["#173e38", "#e34c4c", "#e9b826", "#25844b", "#2478ce", "#a753c6", "#ffffff"];
var normalize = /* @__PURE__ */ __name((s) => String(s).normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " "), "normalize");
function cleanPack(input) {
  if (!Array.isArray(input) || input.length < 3 || input.length > 60) throw Error("A custom pack needs 3\u201360 words.");
  const seen = /* @__PURE__ */ new Set();
  return input.map((w) => {
    if (!w || typeof w.word !== "string" || !Array.isArray(w.aliases) || w.aliases.length > 6) throw Error("Use word and aliases for each entry.");
    const word = w.word.trim();
    if (!/^[\p{L}\p{N}][\p{L}\p{N} '-]{0,39}$/u.test(word) || seen.has(normalize(word))) throw Error("Use unique words, up to 40 letters.");
    seen.add(normalize(word));
    const aliases = w.aliases.map((a) => {
      if (typeof a !== "string" || !a.trim() || a.length > 40) throw Error("Aliases must be short text.");
      return a.trim();
    });
    return { word, aliases };
  });
}
__name(cleanPack, "cleanPack");
var fail = /* @__PURE__ */ __name((message) => {
  throw Error(message);
}, "fail");
var random = /* @__PURE__ */ __name((n) => crypto.getRandomValues(new Uint32Array(1))[0] % n, "random");
var shuffle = /* @__PURE__ */ __name((a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}, "shuffle");
function createParty(kind, now) {
  return { kind, created: now, expires: now + 864e5, touched: now, revision: 0, phase: "lobby", players: [], host: null, locked: false, round: 0, deadline: 0, feed: [], pack: "english", custom: null, queue: [], drawing: [], points: 0, canvasVersion: 0, solved: [], seen: [] };
}
__name(createParty, "createParty");
function addPlayer(r, token2, nickname, avatar, now) {
  if (r.locked || !["lobby", "finished"].includes(r.phase)) fail("This room is locked or already playing.");
  if (r.players.length >= 8) fail("This room is full (8 players).");
  const name = String(nickname || "Player").trim().slice(0, 20) || "Player";
  const p = { id: crypto.randomUUID(), token: token2, name, avatar: Number.isInteger(avatar) && avatar >= 0 && avatar < 6 ? avatar : 0, score: 0, offline: now };
  r.players.push(p);
  r.host ??= p.id;
  r.revision++;
  return p;
}
__name(addPlayer, "addPlayer");
var connected = /* @__PURE__ */ __name((r) => r.players.filter((p) => p.offline === null), "connected");
function note(r, text) {
  r.feed.push({ text });
  r.feed = r.feed.slice(-30);
}
__name(note, "note");
function endDraw(r, now, reason = "Time is up.") {
  r.phase = "reveal";
  r.deadline = now + 7e3;
  r.reveal = r.word?.word || "";
  r.reason = reason;
  note(r, reason + (r.reveal ? " Word: " + r.reveal : ""));
}
__name(endDraw, "endDraw");
function nextDraw(r, now) {
  if (!r.queue.length) {
    r.phase = "finished";
    r.deadline = 0;
    note(r, "Match complete. The host can start a rematch.");
    return;
  }
  if (connected(r).length < 3) {
    r.phase = "paused";
    r.deadline = 0;
    note(r, "Waiting for at least 3 connected players. Host can resume.");
    return;
  }
  let id;
  while (r.queue.length && !id) {
    const candidate = r.queue.shift();
    if (connected(r).some((p) => p.id === candidate)) id = candidate;
  }
  if (!id) {
    r.phase = "finished";
    r.deadline = 0;
    return;
  }
  r.drawer = id;
  r.round++;
  r.roundId = crypto.randomUUID();
  r.canvasVersion++;
  r.drawing = [];
  r.points = 0;
  r.solved = [];
  r.word = null;
  r.reveal = "";
  r.reason = "";
  r.choices = shuffle(r.custom || draw_words_default[r.pack]).slice(0, 3);
  r.phase = "choose";
  r.deadline = now + 15e3;
}
__name(nextDraw, "nextDraw");
function choose(r, index, now) {
  r.word = r.choices[index];
  r.choices = [];
  r.phase = "drawing";
  r.started = now;
  r.hinted = false;
  r.deadline = now + 75e3;
}
__name(choose, "choose");
function advance(r, now) {
  if (r.kind === "quiz") {
    if (r.phase === "question" && now >= r.deadline) {
      closeQuiz(r);
      r.revision++;
      return true;
    }
    return false;
  }
  if (r.phase === "drawing" && !r.hinted && now >= r.started + 4e4 && now < r.deadline) {
    r.hinted = true;
    r.revision++;
    return true;
  }
  if (r.deadline && now >= r.deadline) {
    if (r.phase === "choose") choose(r, 0, now);
    else if (r.phase === "drawing") endDraw(r, now);
    else if (r.phase === "reveal") nextDraw(r, now);
    r.revision++;
    return true;
  }
  return false;
}
__name(advance, "advance");
function depart(r, id, now, remove = false) {
  const p = r.players.find((x) => x.id === id);
  if (!p) return;
  p.offline = now;
  if (remove) r.players = r.players.filter((x) => x.id !== id);
  if (r.host === id) r.host = connected(r)[0]?.id || r.players[0]?.id || null;
  if (r.drawer === id && ["choose", "drawing"].includes(r.phase)) endDraw(r, now, "Drawer disconnected. This turn was skipped.");
  note(r, p.name + (remove ? " left the room." : " disconnected; reconnect within 60 seconds."));
  r.revision++;
}
__name(depart, "depart");
function partyAction(r, id, m, now) {
  const p = r.players.find((x) => x.id === id);
  if (!p) fail("Seat is no longer available.");
  advance(r, now);
  if (typeof m.id !== "string" || m.id.length > 64 || m.id.length < 8) fail("A command ID is required.");
  if (r.seen.includes(id + ":" + m.id)) fail("Duplicate command ignored.");
  r.seen.push(id + ":" + m.id);
  r.seen = r.seen.slice(-256);
  const host = /* @__PURE__ */ __name(() => {
    if (r.host !== id) fail("Only the host can do that.");
  }, "host");
  if (m.type === "lock") {
    host();
    r.locked = !r.locked;
  } else if (m.type === "kick") {
    host();
    if (m.player === id) fail("Use Leave to leave the room.");
    if (!r.players.some((x) => x.id === m.player)) fail("Unknown player.");
    depart(r, m.player, now, true);
  } else if (m.type === "leave") {
    depart(r, id, now, true);
  } else if (m.type === "pack") {
    host();
    if (r.kind !== "draw") fail("This game has no word packs.");
    if (!["lobby", "finished"].includes(r.phase)) fail("Change packs between matches.");
    if (!["english", "hindi", "custom"].includes(m.pack)) fail("Unknown word pack.");
    r.custom = m.pack === "custom" ? cleanPack(m.words) : null;
    r.pack = m.pack;
  } else if (m.type === "start") {
    host();
    if (!["lobby", "finished", "paused"].includes(r.phase)) fail("Match already started.");
    if (r.kind === "quiz") startQuiz(r, now);
    else {
      if (connected(r).length < 3) fail("Draw needs 3 connected players.");
      if (r.phase !== "paused") {
        r.players.forEach((x) => x.score = 0);
        r.queue = connected(r).map((x) => x.id);
        r.round = 0;
        r.total = r.queue.length;
        r.feed = [];
      }
      r.locked = true;
      nextDraw(r, now);
    }
  } else if (m.type === "skip") {
    host();
    if (r.kind !== "draw" || !["choose", "drawing", "reveal"].includes(r.phase)) fail("No round to skip.");
    if (r.phase === "reveal") nextDraw(r, now);
    else endDraw(r, now, "Host skipped this turn.");
  } else if (r.kind === "quiz") quizAction(r, p, m, now);
  else {
    if (m.roundId !== r.roundId) fail("That input belongs to an earlier round.");
    if (m.type === "choose") {
      if (id !== r.drawer || r.phase !== "choose" || !Number.isInteger(m.choice) || m.choice < 0 || m.choice > 2) fail("Only the drawer can choose a word.");
      choose(r, m.choice, now);
    } else if (m.type === "guess") {
      if (r.phase !== "drawing" || id === r.drawer || r.solved.includes(id)) fail("You cannot guess now.");
      if (typeof m.text !== "string" || !m.text.trim() || m.text.length > 80) fail("Use a guess of 1\u201380 characters.");
      if ([r.word.word, ...r.word.aliases].some((w) => normalize(w) === normalize(m.text))) {
        p.score += 100 + Math.floor(200 * Math.max(0, r.deadline - now) / 75e3);
        const d = r.players.find((x) => x.id === r.drawer);
        if (d) d.score += 50;
        r.solved.push(id);
        note(r, p.name + " guessed correctly!");
        if (connected(r).filter((x) => x.id !== r.drawer).every((x) => r.solved.includes(x.id))) endDraw(r, now, "Everyone guessed it!");
      } else note(r, p.name + ": " + m.text.trim());
    } else if (["stroke", "undo", "clear"].includes(m.type)) {
      if (r.phase !== "drawing" || id !== r.drawer) fail("Only the current drawer can draw.");
      if (m.canvasVersion !== r.canvasVersion) fail("Canvas changed. Try again.");
      if (m.type === "clear") {
        r.drawing = [];
        r.points = 0;
        r.canvasVersion++;
      } else if (m.type === "undo") {
        const last = r.drawing.pop();
        if (last) r.points -= last.points.length;
        r.canvasVersion++;
      } else {
        if (typeof m.stroke !== "string" || m.stroke.length > 64 || !Number.isInteger(m.seq) || !Array.isArray(m.points) || m.points.length < 1 || m.points.length > 32 || !m.points.every((v) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n) && n >= 0 && n <= 1))) fail("Invalid drawing batch.");
        let s = r.drawing.find((x) => x.id === m.stroke);
        if (!s) {
          if (m.seq !== 0 || r.drawing.length >= 120 || !COLORS.includes(m.color) || ![3, 7, 14, 24].includes(m.size)) fail("Drawing limit reached or invalid brush.");
          s = { id: m.stroke, seq: 0, color: m.color, size: m.size, points: [] };
          r.drawing.push(s);
        }
        if (s.seq !== m.seq) fail("Drawing batch is stale.");
        if (r.points + m.points.length > 8e3) fail("Canvas is full. Undo or clear to continue.");
        s.points.push(...m.points);
        s.seq++;
        r.points += m.points.length;
      }
    } else fail("Unknown command.");
  }
  r.touched = now;
  r.revision++;
}
__name(partyAction, "partyAction");
function partySnapshot(r, id, now, includeDrawing = false) {
  const s = { type: "state", kind: r.kind, you: id, host: r.host, phase: r.phase, revision: r.revision, locked: r.locked, round: r.round, total: r.total || 0, roundId: r.roundId, drawer: r.drawer, deadline: r.deadline, serverNow: now, pack: r.pack, canvasVersion: r.canvasVersion, feed: r.feed, players: r.players.map(({ id: id2, name, avatar, score, offline }) => ({ id: id2, name, avatar, score, connected: offline === null })), solved: r.solved, reveal: r.phase === "reveal" ? r.reveal : void 0, reason: r.reason };
  if (id === r.drawer && r.phase === "choose") s.choices = r.choices.map((x) => x.word);
  if (r.phase === "drawing") {
    if (id === r.drawer) s.word = r.word.word;
    else {
      const elapsed = now - r.started;
      s.hint = Array.from(r.word.word).map((c, i) => c === " " ? " / " : elapsed >= 4e4 && i === 0 ? c : "_").join(" ");
    }
  }
  if (includeDrawing) s.drawing = r.drawing;
  if (r.kind === "quiz") Object.assign(s, quizSnapshot(r, id));
  return s;
}
__name(partySnapshot, "partySnapshot");

// party-room.mjs
var json = /* @__PURE__ */ __name((x, status = 200) => new Response(JSON.stringify(x), { status, headers: { "Content-Type": "application/json" } }), "json");
var PartyRoom = class {
  static {
    __name(this, "PartyRoom");
  }
  constructor(ctx) {
    this.ctx = ctx;
    this.room = null;
    ctx.blockConcurrencyWhile(async () => {
      this.room = await ctx.storage.get("party");
    });
  }
  async fetch(req) {
    const path = new URL(req.url).pathname, now = Date.now();
    if (req.method === "POST" && (path === "/create" || path === "/join")) {
      const body = await req.text();
      if (body.length > 1024) return json({ error: "Request too large." }, 413);
      let m;
      try {
        m = JSON.parse(body);
      } catch {
        return json({ error: "Invalid request." }, 400);
      }
      if (!m || typeof m !== "object") return json({ error: "Invalid request." }, 400);
      if (path === "/create") {
        if (this.room) return json({ error: "Room exists." }, 409);
        if (!["draw", "quiz"].includes(m.kind)) return json({ error: "Unknown game." }, 400);
        this.room = createParty(m.kind, now);
      }
      if (!this.room || now >= this.room.expires) return json({ error: "Room expired." }, 410);
      try {
        const p = addPlayer(this.room, crypto.randomUUID() + crypto.randomUUID(), m.name, m.avatar, now);
        await this.save();
        this.broadcast();
        return json({ token: p.token, seat: p.id });
      } catch (e) {
        return json({ error: e.message }, 409);
      }
    }
    if (!this.room || now >= this.room.expires) return json({ error: "Room expired." }, 410);
    if (path === "/socket" && req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      if (this.ctx.getWebSockets().length >= 16) return json({ error: "Too many connections." }, 429);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ seat: null, opened: now, window: now, count: 0 });
      await this.schedule();
      return new Response(null, { status: 101, webSocket: client });
    }
    return json({ error: "Unknown route." }, 404);
  }
  broadcast(full = false) {
    for (const ws of this.ctx.getWebSockets()) {
      const id = ws.deserializeAttachment()?.seat;
      if (id && this.room.players.some((p) => p.id === id)) try {
        ws.send(JSON.stringify(partySnapshot(this.room, id, Date.now(), full)));
      } catch {
      }
    }
  }
  async schedule() {
    const now = Date.now(), r = this.room;
    if (!r) return;
    const pending = this.ctx.getWebSockets().map((s) => s.deserializeAttachment()).filter((a) => !a.seat && a.opened + 1e4 > now).map((a) => a.opened + 1e4);
    const offline = r.players.filter((p) => p.offline !== null).map((p) => p.offline + 6e4);
    await this.ctx.storage.setAlarm(Math.max(now + 1, Math.min(r.expires, r.deadline || Infinity, r.phase === "drawing" && !r.hinted ? r.started + 4e4 : Infinity, ...pending, ...offline, connected(r).length ? Infinity : r.touched + 18e5)));
  }
  async save() {
    await this.ctx.storage.put("party", this.room);
    await this.schedule();
  }
  async webSocketMessage(ws, data) {
    try {
      await this.handle(ws, data);
    } catch {
      ws.close(1013, "Room unavailable. Reconnect later.");
    }
  }
  async handle(ws, data) {
    const now = Date.now(), a = ws.deserializeAttachment(), r = this.room;
    if (!r || now >= r.expires) return ws.close(1e3, "Room expired");
    if (typeof data !== "string" || data.length > 16384) return ws.close(1009, "Message too large");
    if (now - a.window >= 1e3) {
      a.count = 0;
      a.window = now;
    }
    a.count++;
    ws.serializeAttachment(a);
    if (a.count > 20) return ws.close(1008, "Input rate exceeded");
    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return ws.send(JSON.stringify({ type: "error", message: "Invalid message." }));
    }
    if (!m || typeof m !== "object") return;
    if (!a.seat) {
      if (m.type !== "auth" || typeof m.token !== "string") return ws.close(1008, "Authenticate first");
      const p = r.players.find((x) => x.token === m.token);
      if (!p) return ws.close(1008, "Invalid session token");
      for (const old of this.ctx.getWebSockets()) if (old !== ws && old.deserializeAttachment()?.seat === p.id) {
        old.serializeAttachment({ ...old.deserializeAttachment(), seat: null });
        old.close(1e3, "Seat opened in another tab");
      }
      a.seat = p.id;
      ws.serializeAttachment(a);
      p.offline = null;
      r.touched = now;
      r.revision++;
      await this.save();
      this.broadcast(true);
      return;
    }
    if (m.type === "sync") {
      if (advance(r, now)) {
        await this.save();
        this.broadcast(true);
      } else ws.send(JSON.stringify(partySnapshot(r, a.seat, now, true)));
      return;
    }
    const oldVersion = r.canvasVersion;
    try {
      partyAction(r, a.seat, m, now);
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: e.message }));
      await this.save();
      this.broadcast(true);
      return;
    }
    for (const s of this.ctx.getWebSockets()) if (s.deserializeAttachment()?.seat && !r.players.some((p) => p.id === s.deserializeAttachment().seat)) {
      s.serializeAttachment({ ...s.deserializeAttachment(), seat: null });
      s.close(1e3, "You left or were removed from the room");
    }
    await this.save();
    if (m.type === "stroke" && oldVersion === r.canvasVersion) {
      const stroke = r.drawing.find((s) => s.id === m.stroke);
      for (const s of this.ctx.getWebSockets()) if (s.deserializeAttachment()?.seat) s.send(JSON.stringify({ type: "ink", canvasVersion: r.canvasVersion, stroke: m.stroke, seq: m.seq, points: m.points, color: stroke.color, size: stroke.size }));
    } else this.broadcast(true);
  }
  async webSocketClose(ws) {
    await this.disconnected(ws);
  }
  async webSocketError(ws) {
    await this.disconnected(ws);
  }
  async disconnected(ws) {
    const a = ws.deserializeAttachment();
    ws.serializeAttachment({ ...a, seat: null });
    if (a.seat && this.room && !this.ctx.getWebSockets().some((s) => s.deserializeAttachment()?.seat === a.seat)) {
      depart(this.room, a.seat, Date.now());
      await this.save();
      this.broadcast(true);
    }
  }
  async alarm() {
    const now = Date.now(), r = this.room;
    if (!r) return;
    for (const s of this.ctx.getWebSockets()) {
      const a = s.deserializeAttachment();
      if (!a.seat && now >= a.opened + 1e4) s.close(1008, "Authentication timed out");
    }
    if (now >= r.expires || !connected(r).length && now - r.touched >= 18e5) {
      for (const s of this.ctx.getWebSockets()) s.close(1e3, "Room expired");
      await this.ctx.storage.deleteAll();
      this.room = null;
      return;
    }
    for (const p of [...r.players]) if (p.offline !== null && now >= p.offline + 6e4) depart(r, p.id, now, true);
    advance(r, now);
    await this.save();
    this.broadcast(true);
  }
};

// worker.mjs
var TTL = 24 * 60 * 60 * 1e3;
var IDLE = 30 * 60 * 1e3;
var GRACE = 6e4;
var token = /* @__PURE__ */ __name(() => crypto.randomUUID() + crypto.randomUUID(), "token");
function json2(body, status = 200, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {} } });
}
__name(json2, "json");
function allowed(origin) {
  try {
    const u = new URL(origin);
    return u.origin === origin && (u.hostname === "moosher.duvera.app" || u.hostname === "duvera-moosher.pages.dev" || u.hostname.endsWith(".duvera-moosher.pages.dev") || ["localhost", "127.0.0.1"].includes(u.hostname) && u.protocol === "http:");
  } catch {
    return false;
  }
}
__name(allowed, "allowed");
var worker_default = { async fetch(req, env) {
  const origin = req.headers.get("Origin") || "";
  if (!allowed(origin)) return json2({ error: "This game origin is not allowed." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "600", "Vary": "Origin" } });
  const url = new URL(req.url);
  try {
    const party = url.pathname.match(/^\/party\/(draw|quiz)\/rooms(?:\/([a-f0-9-]{36})\/(join|socket))?$/);
    if (req.method === "POST" && (url.pathname === "/rooms" || party && !party[2])) {
      const ip = req.headers.get("CF-Connecting-IP") || "local";
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
      const hash = Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("");
      const gate = env.ROOMS.get(env.ROOMS.idFromName("gate:" + hash));
      const permitted = await gate.fetch("https://room/gate", { method: "POST" });
      if (!permitted.ok) return json2({ error: "Room creation limit reached. Try later or play solo." }, 429, origin);
      const id = crypto.randomUUID(), binding = party ? env.PARTIES : env.ROOMS, room = binding.get(binding.idFromName(party ? party[1] + ":" + id : id));
      let body;
      if (party) {
        const raw = await req.text();
        if (raw.length > 1024) return json2({ error: "Request too large." }, 413, origin);
        let input;
        try {
          input = JSON.parse(raw);
        } catch {
          return json2({ error: "Invalid request." }, 400, origin);
        }
        body = JSON.stringify({ ...input, kind: party[1] });
      }
      const response2 = await room.fetch("https://room/create", { method: "POST", body });
      return json2({ ...await response2.json(), room: id }, response2.status, origin);
    }
    if (party && party[2]) {
      const response2 = await env.PARTIES.get(env.PARTIES.idFromName(party[1] + ":" + party[2])).fetch(new Request("https://room/" + party[3], req));
      if (response2.status === 101) return response2;
      return json2(await response2.json(), response2.status, origin);
    }
    const match = url.pathname.match(/^\/rooms\/([a-f0-9-]{36})\/(join|socket)$/);
    if (!match) return json2({ error: "Unknown room route." }, 404, origin);
    const response = await env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(new Request("https://room/" + match[2], req));
    if (response.status === 101) return response;
    return json2(await response.json(), response.status, origin);
  } catch {
    return json2({ error: "Room service is unavailable or at its quota. Your solo game is still available." }, 503, origin);
  }
} };
var FourRoom = class {
  static {
    __name(this, "FourRoom");
  }
  constructor(ctx) {
    this.ctx = ctx;
    this.room = null;
    this.gate = null;
    ctx.blockConcurrencyWhile(async () => {
      this.room = await ctx.storage.get("room");
      this.gate = await ctx.storage.get("gate");
    });
  }
  async fetch(req) {
    const path = new URL(req.url).pathname, now = Date.now();
    if (path === "/gate") {
      if (!this.gate || now > this.gate.until) this.gate = { count: 0, until: now + 36e5 };
      if (this.gate.count >= 10) return json2({}, 429);
      this.gate.count++;
      await this.ctx.storage.put("gate", this.gate);
      await this.ctx.storage.setAlarm(this.gate.until);
      return json2({ ok: true });
    }
    if (path === "/create" && req.method === "POST") {
      if (this.room) return json2({ error: "Room exists." }, 409);
      this.room = { created: now, expires: now + TTL, touched: now, board: emptyBoard(), turn: 1, status: "waiting", revision: 0, match: 1, seats: [{ token: token(), ready: false, rematch: false, offline: now }, null], winner: null };
      await this.save();
      return json2({ token: this.room.seats[0].token, seat: 1 });
    }
    if (!this.room || now > this.room.expires) return json2({ error: "Room expired. Create a new invite." }, 410);
    if (path === "/join" && req.method === "POST") {
      if (this.room.seats[1]) return json2({ error: "This room already has two players." }, 409);
      if (this.room.status !== "waiting") return json2({ error: "This match has closed." }, 409);
      this.room.seats[1] = { token: token(), ready: false, rematch: false, offline: now };
      this.room.revision++;
      await this.save();
      this.broadcast();
      return json2({ token: this.room.seats[1].token, seat: 2 });
    }
    if (path === "/socket" && req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      if (this.ctx.getWebSockets().length >= 8) return json2({ error: "Too many connections. Close duplicate tabs and retry." }, 429);
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ seat: 0, opened: now, count: 0, window: now });
      await this.ctx.storage.setAlarm(Math.min(now + 1e4, this.room.expires));
      return new Response(null, { status: 101, webSocket: client });
    }
    return json2({ error: "Method not allowed." }, 405);
  }
  connected(seat) {
    return this.ctx.getWebSockets().some((s) => s.deserializeAttachment()?.seat === seat && s.readyState === 1);
  }
  snapshot(seat) {
    const r = this.room;
    return { type: "state", seat, board: r.board, turn: r.turn, status: r.status, revision: r.revision, match: r.match, winner: r.winner, winning: r.winning || [], expires: r.expires, seats: r.seats.map((s, i) => s ? { ready: s.ready, rematch: s.rematch, connected: this.connected(i + 1), offline: s.offline } : null) };
  }
  broadcast() {
    for (const ws of this.ctx.getWebSockets()) {
      const seat = ws.deserializeAttachment()?.seat;
      if (seat) try {
        ws.send(JSON.stringify(this.snapshot(seat)));
      } catch {
      }
    }
  }
  async save() {
    const r = this.room;
    r.touched = Date.now();
    await this.ctx.storage.put("room", r);
    const allOff = !this.connected(1) && !this.connected(2);
    const pending = this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment()).filter((a) => !a.seat).map((a) => a.opened + 1e4);
    await this.ctx.storage.setAlarm(Math.min(r.expires, allOff ? Date.now() + IDLE : r.expires, ...pending));
  }
  async webSocketMessage(ws, data) {
    try {
      await this.handleMessage(ws, data);
    } catch {
      for (const socket of this.ctx.getWebSockets()) socket.close(1013, "Room service is at capacity. Try reconnecting later or play solo.");
    }
  }
  async handleMessage(ws, data) {
    const a = ws.deserializeAttachment(), now = Date.now();
    const error = /* @__PURE__ */ __name((message) => ws.send(JSON.stringify({ type: "error", message })), "error");
    if (typeof data !== "string" || data.length > 1024) {
      ws.close(1009, "Message too large");
      return;
    }
    if (now - a.window > 1e3) {
      a.window = now;
      a.count = 0;
    }
    a.count++;
    ws.serializeAttachment(a);
    if (a.count > 12) {
      ws.close(1008, "Too many inputs");
      return;
    }
    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return error("Invalid message.");
    }
    if (!m || typeof m !== "object") return error("Invalid message.");
    if (!this.room || now > this.room.expires) {
      ws.close(1e3, "Room expired");
      return;
    }
    if (!a.seat) {
      if (m.type !== "auth" || typeof m.token !== "string") return ws.close(1008, "Authenticate first");
      const seat = this.room.seats.findIndex((s2) => s2?.token === m.token) + 1;
      if (!seat) return ws.close(1008, "Invalid seat token");
      for (const old of this.ctx.getWebSockets()) if (old !== ws && old.deserializeAttachment()?.seat === seat) {
        old.serializeAttachment({ ...old.deserializeAttachment(), seat: 0 });
        old.close(1e3, "Seat opened in another tab");
      }
      a.seat = seat;
      ws.serializeAttachment(a);
      this.room.seats[seat - 1].offline = null;
      if (this.room.status === "waiting" && this.room.seats.every((x) => x?.ready) && this.connected(1) && this.connected(2)) {
        this.room.status = "playing";
        this.room.revision++;
      }
      if (this.room.status === "over" && this.room.seats.every((x) => x?.rematch) && this.connected(1) && this.connected(2)) {
        this.room.board = emptyBoard();
        this.room.match++;
        this.room.turn = this.room.match % 2 ? 1 : 2;
        this.room.winner = null;
        this.room.winning = [];
        this.room.status = "playing";
        this.room.seats.forEach((x) => x.rematch = false);
        this.room.revision++;
      }
      await this.save();
      this.broadcast();
      return;
    }
    const r = this.room, s = r.seats[a.seat - 1];
    if (m.type === "sync") {
      ws.send(JSON.stringify(this.snapshot(a.seat)));
      return;
    }
    if (m.revision !== r.revision) return error("Board changed. Wait for the latest state.");
    if (m.type === "ready" && r.status === "waiting") {
      s.ready = true;
      if (r.seats.every((x) => x?.ready) && this.connected(1) && this.connected(2)) r.status = "playing";
    } else if (m.type === "move" && r.status === "playing") {
      if (r.turn !== a.seat) return error("Wait for your turn.");
      if (!this.connected(3 - a.seat)) return error("Opponent disconnected. Wait for reconnect or claim the timeout.");
      const next = move(r.board, m.column, a.seat);
      if (!next) return error("Choose an open column.");
      r.board = next;
      const end = result(next);
      if (end) {
        r.status = "over";
        r.winner = end.winner;
        r.winning = end.cells;
      } else r.turn = 3 - r.turn;
    } else if (m.type === "rematch" && r.status === "over") {
      s.rematch = true;
      if (r.seats.every((x) => x?.rematch) && this.connected(1) && this.connected(2)) {
        r.board = emptyBoard();
        r.match++;
        r.turn = r.match % 2 ? 1 : 2;
        r.winner = null;
        r.winning = [];
        r.status = "playing";
        r.seats.forEach((x) => x.rematch = false);
      }
    } else if (m.type === "claim" && r.status === "playing") {
      const other = r.seats[2 - a.seat];
      if (this.connected(3 - a.seat) || !other?.offline || now - other.offline < GRACE) return error("The reconnect window is still open.");
      r.status = "over";
      r.winner = a.seat;
      r.reason = "disconnect";
    } else if (m.type === "leave") {
      r.status = "closed";
      r.winner = null;
      r.seats.forEach((x) => {
        if (x) x.token = token();
      });
    } else return error("That action is not available.");
    r.revision++;
    await this.save();
    this.broadcast();
    if (r.status === "closed") for (const socket of this.ctx.getWebSockets()) socket.close(1e3, "A player left the room");
  }
  async webSocketClose(ws) {
    await this.disconnected(ws);
  }
  async webSocketError(ws) {
    await this.disconnected(ws);
  }
  async disconnected(ws) {
    const seat = ws.deserializeAttachment()?.seat;
    ws.serializeAttachment({ ...ws.deserializeAttachment(), seat: 0 });
    if (seat && this.room && !this.connected(seat)) {
      this.room.seats[seat - 1].offline = Date.now();
      await this.save();
      this.broadcast();
    }
  }
  async alarm() {
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a?.seat && now - a.opened >= 1e4) ws.close(1008, "Authentication timed out");
    }
    if (this.gate && now >= this.gate.until) {
      await this.ctx.storage.deleteAll();
      this.gate = null;
      return;
    }
    if (!this.room) return;
    if (now >= this.room.expires || !this.connected(1) && !this.connected(2) && now - this.room.touched >= IDLE) {
      for (const ws of this.ctx.getWebSockets()) ws.close(1e3, "Room expired");
      await this.ctx.storage.deleteAll();
      this.room = null;
      return;
    }
    await this.ctx.storage.setAlarm(Math.min(this.room.expires, now + IDLE));
  }
};
export {
  FourRoom,
  PartyRoom,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
