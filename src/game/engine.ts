import { DAYS, INNERS, PERSONAS, type ChannelId, type QuestionId, speak } from "./content";
import { PATTERNS, SLOTS, type ClueSlot } from "./patterns";

export type Mark = "sus" | "safe";

export type LogKind = "chat" | "dm" | "archive" | "voice" | "cross" | "kick" | "leave" | "join" | "image" | "stamp" | "system";

export type LogItem = {
  id: string;
  kind: LogKind;
  day: number;
  channel?: ChannelId;
  personaId?: string;
  targetId?: string;
  questionId?: QuestionId;
  text: string;
  image?: string;
  stamp?: string;
  slot?: string;
  innerId?: string;
  votes?: { id: string; count: number }[];
};

export type Probe = {
  personaId: string;
  kind: "dm" | "archive" | "voice" | "cross";
  questionId?: QuestionId;
  targetId?: string;
};

export type Result = {
  win: boolean;
  reason: "kick" | "last" | "miss";
  pickedId: string;
  score: number;
  day: number;
  probesUsed: number;
  exiles: number;
  breakdown: { label: string; value: number }[];
};

export type GameState = {
  screen: "title" | "play" | "result";
  seed: number;
  assignments: Record<string, string>;
  day: number;
  probesLeft: number;
  voiceUsed: boolean;
  probes: Probe[];
  exiled: string[];
  fate: Record<string, "kick" | "eaten">;
  log: LogItem[];
  marks: Record<string, Mark | undefined>;
  notes: Record<string, string>;
  selected: string | null;
  result: Result | null;
};

export type Action =
  | { type: "start"; seed: number }
  | { type: "title" }
  | { type: "select"; id: string }
  | { type: "mark"; id: string; mark: Mark }
  | { type: "note"; id: string; text: string }
  | { type: "dm"; questionId: QuestionId }
  | { type: "archive" }
  | { type: "voice" }
  | { type: "cross"; targetId: string }
  | { type: "vote"; id: string }
  | { type: "endDay" }
  | { type: "hydrate"; state: GameState };

export const initialState: GameState = {
  screen: "title",
  seed: 1,
  assignments: {},
  day: 0,
  probesLeft: 2,
  voiceUsed: false,
  probes: [],
  exiled: [],
  fate: {},
  log: [],
  marks: {},
  notes: {},
  selected: null,
  result: null,
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deal(seed: number): Record<string, string> {
  const rng = mulberry32(seed || 1);
  const ids = Object.keys(INNERS);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = ids[i];
    ids[i] = ids[j] ?? ids[i];
    ids[j] = swap ?? ids[j];
  }
  const map: Record<string, string> = {};
  PERSONAS.forEach((persona, index) => {
    map[persona.id] = ids[index] ?? "girl";
  });
  return map;
}

function innerOf(state: GameState, personaId: string) {
  const id = state.assignments[personaId];
  const inner = id ? INNERS[id] : undefined;
  if (!inner) throw new Error(`no inner for ${personaId}`);
  return inner;
}

function publicChats(state: Pick<GameState, "assignments" | "exiled" | "seed" | "day">, day: number): LogItem[] {
  return PERSONAS.filter((persona) => !state.exiled.includes(persona.id)).map((persona, index) => {
    const innerId = state.assignments[persona.id] ?? "girl";
    const inner = INNERS[innerId];
    return {
      id: `chat-${state.seed}-${day}-${persona.id}`,
      kind: "chat" as const,
      channel: "zatsu" as const,
      day,
      personaId: persona.id,
      text: speak(persona.id, inner?.days[day] ?? "", state.seed + day * 17 + index),
    };
  });
}

function dayIntro(day: number, alive: number, seed: number): LogItem {
  const info = DAYS[day] ?? DAYS[0];
  return {
    id: `sys-${seed}-${day}`,
    kind: "system",
    channel: "zatsu",
    day,
    text: `${info.label}・${info.title}。サーバーに${alive}人。話題は「${info.topic}」。`,
  };
}

function pickSlots(seed: number, personaId: string): ClueSlot[] {
  let n = 0;
  for (const ch of personaId) n = (n * 33 + ch.charCodeAt(0)) | 0;
  const rng = mulberry32((seed || 1) + (n >>> 0) + 17);
  const slots = [...SLOTS];
  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = slots[i];
    slots[i] = slots[j] ?? slots[i];
    slots[j] = swap ?? slots[j];
  }
  const chosen = slots.slice(0, 3);
  if (!chosen.includes("image") && !chosen.includes("file")) {
    chosen[Math.floor(rng() * 3)] = "image";
  }
  return chosen;
}

const VOICED = new Set<ClueSlot>(["join", "status", "about", "stamp", "image", "react"]);

const SLOT_LABEL: Record<ClueSlot, string> = {
  join: "参加",
  voice: "ボイス",
  audit: "監査",
  status: "ステータス",
  about: "自己紹介",
  nick: "ニックネーム",
  react: "リアクション",
  stamp: "スタンプ",
  image: "画像",
  file: "ファイル",
  pin: "ピン留め",
};

function patternLogs(assignments: Record<string, string>, seed: number, day: number, exiled: string[]): LogItem[] {
  const items: LogItem[] = [];
  for (const persona of PERSONAS) {
    if (exiled.includes(persona.id)) continue;
    const inner = INNERS[assignments[persona.id] ?? ""];
    if (!inner) continue;
    const slot = pickSlots(seed, persona.id)[day];
    if (!slot) continue;
    const pattern = PATTERNS.find((item) => item.inner === inner.id && item.slot === slot && item.tier === day);
    if (!pattern) continue;
    const said = VOICED.has(slot) ? speak(persona.id, pattern.text, seed + day * 13 + persona.id.length) : pattern.text;
    const base = {
      id: `pat-${seed}-${day}-${persona.id}`,
      day,
      personaId: persona.id,
      slot: SLOT_LABEL[slot],
    };
    if (slot === "join") {
      items.push({ ...base, kind: "join", channel: "join", text: said });
    } else if (slot === "voice") {
      items.push({ ...base, kind: "system", channel: "join", text: `${persona.name} がボイスチャンネルに参加しました。${said}` });
    } else if (slot === "audit") {
      items.push({ ...base, kind: "system", channel: "join", text: `監査ログ ${persona.name} — ${said}` });
    } else if (slot === "status" || slot === "about") {
      items.push({ ...base, kind: "chat", channel: "profile", text: said });
    } else if (slot === "nick") {
      items.push({ ...base, kind: "system", channel: "profile", text: `${persona.name} がニックネームを更新しました。${said}` });
    } else if (slot === "pin") {
      items.push({ ...base, kind: "system", channel: "profile", text: `ピン留め ${persona.name} — ${said}` });
    } else if (slot === "react") {
      items.push({ ...base, kind: "chat", channel: "react", text: said });
    } else if (slot === "stamp") {
      items.push({ ...base, kind: "stamp", channel: "stamp", stamp: inner.stampEmoji, text: said });
    } else if (slot === "file") {
      items.push({ ...base, kind: "image", channel: "media", image: `/logs/${inner.id}.jpg`, text: `ファイルをアップロードしました：${said}` });
    } else {
      items.push({ ...base, kind: "image", channel: "media", image: `/logs/${inner.id}.jpg`, text: said });
    }
  }
  return items;
}

export function createGame(seed: number): GameState {
  const assignments = deal(seed);
  const day = 0;
  return {
    ...initialState,
    screen: "play",
    seed,
    assignments,
    day,
    probesLeft: 2,
    log: [
      {
        id: `stamp-prompt-${seed}`,
        kind: "system",
        channel: "stamp",
        day,
        text: "NAKANO-BOT がスタンプを募りました。いまの気分を、ひとつ置いて。",
      },
      dayIntro(day, PERSONAS.length, seed),
      ...publicChats({ assignments, exiled: [], seed, day }, day),
      ...patternLogs(assignments, seed, day, []),
    ],
  };
}

function scoreFor(state: GameState, win: boolean): Pick<Result, "score" | "breakdown"> {
  if (!win) return { score: 0, breakdown: [] };
  const dayBonus = [520, 260, 80][state.day] ?? 0;
  const spare = Math.max(0, 6 - state.probes.length) * 25;
  const breakdown = [
    { label: "見破った", value: 1000 },
    { label: "早さ", value: dayBonus },
    { label: "残った調査", value: spare },
  ];
  return { score: 1000 + dayBonus + spare, breakdown };
}

function makeResult(state: GameState, win: boolean, reason: Result["reason"], pickedId: string): Result {
  const scored = scoreFor(state, win);
  return {
    win,
    reason,
    pickedId,
    day: state.day,
    probesUsed: state.probes.length,
    exiles: state.exiled.length,
    ...scored,
  };
}

function living(state: GameState, personaId: string) {
  return Boolean(state.assignments[personaId]) && !state.exiled.includes(personaId);
}

function pickMeal(state: GameState, exiled: string[], day: number): string | null {
  const rng = mulberry32((state.seed || 1) + (day + 1) * 97);
  const pool = PERSONAS.filter((persona) => !exiled.includes(persona.id) && state.assignments[persona.id] !== "girl").map((persona) => persona.id);
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

function majorityTally(seed: number, day: number, aliveIds: string[], targetId: string) {
  const voters = aliveIds.length + 1;
  const need = Math.floor(voters / 2) + 1;
  const counts = new Map<string, number>();
  aliveIds.forEach((id) => counts.set(id, 0));
  counts.set(targetId, need);
  let rest = voters - need;
  const others = aliveIds.filter((id) => id !== targetId);
  const rng = mulberry32((seed || 1) + day * 131 + aliveIds.length * 17);
  for (let i = others.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = others[i];
    others[i] = others[j] ?? others[i];
    others[j] = swap ?? others[j];
  }
  let cursor = 0;
  while (rest > 0 && others.length > 0) {
    const id = others[cursor % others.length] ?? targetId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    rest -= 1;
    cursor += 1;
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function finishDay(state: GameState, voteId: string | null): GameState {
  if (state.screen !== "play") return state;
  let log = state.log;
  const exiled = [...state.exiled];
  const fate = { ...state.fate };
  if (voteId) {
    if (!living(state, voteId)) return state;
    const aliveIds = PERSONAS.filter((persona) => !exiled.includes(persona.id)).map((persona) => persona.id);
    const votes = majorityTally(state.seed, state.day, aliveIds, voteId);
    const inner = innerOf(state, voteId);
    const total = votes.reduce((sum, row) => sum + row.count, 0);
    const top = votes[0]?.count ?? 0;
    exiled.push(voteId);
    fate[voteId] = "kick";
    log = [
      ...log,
      {
        id: `kick-${state.seed}-${state.day}-${voteId}`,
        kind: "kick" as const,
        day: state.day,
        personaId: voteId,
        innerId: inner.id,
        votes,
        text: `${top}/${total}`,
      },
      {
        id: `kicked-note-${state.seed}-${state.day}-${voteId}`,
        kind: "system" as const,
        channel: "join" as const,
        day: state.day,
        personaId: voteId,
        text: `${PERSONAS.find((persona) => persona.id === voteId)?.name ?? ""} がキックされました`,
      },
    ];
    if (state.assignments[voteId] === "girl") {
      const won = { ...state, log, exiled, fate };
      return { ...won, screen: "result", result: makeResult(won, true, "kick", voteId) };
    }
  } else {
    log = [
      ...log,
      {
        id: `novote-${state.seed}-${state.day}`,
        kind: "system" as const,
        day: state.day,
        text: "投票は過半数に届かなかった。キックは見送り。",
        channel: "zatsu",
      },
    ];
  }
  const meal = pickMeal(state, exiled, state.day);
  if (meal) {
    const inner = innerOf(state, meal);
    exiled.push(meal);
    fate[meal] = "eaten";
    log = [
      ...log,
      {
        id: `leave-${state.seed}-${state.day}-${meal}`,
        kind: "leave" as const,
        channel: "join" as const,
        day: state.day,
        personaId: meal,
        innerId: inner.id,
        text: inner.bitten,
      },
      {
        id: `left-note-${state.seed}-${state.day}-${meal}`,
        kind: "system" as const,
        channel: "zatsu" as const,
        day: state.day,
        personaId: meal,
        text: `${PERSONAS.find((persona) => persona.id === meal)?.name ?? ""} がサーバーを退出しました`,
      },
    ];
  }
  const alive = PERSONAS.filter((persona) => !exiled.includes(persona.id));
  const next: GameState = { ...state, log, exiled, fate };
  const last = alive[0];
  if (alive.length === 1 && last && state.assignments[last.id] === "girl") {
    return { ...next, screen: "result", result: makeResult(next, true, "last", last.id) };
  }
  if (state.day >= 2) {
    return { ...next, screen: "result", result: makeResult(next, false, "miss", voteId ?? "") };
  }
  const day = state.day + 1;
  const slice = { assignments: state.assignments, exiled, seed: state.seed, day };
  return {
    ...next,
    day,
    probesLeft: 2,
    voiceUsed: false,
    log: [...log, dayIntro(day, alive.length, state.seed), ...publicChats(slice, day), ...patternLogs(state.assignments, state.seed, day, exiled)],
  };
}

function pushProbe(state: GameState, probe: Probe, item: LogItem): GameState {
  return {
    ...state,
    probesLeft: state.probesLeft - 1,
    voiceUsed: state.voiceUsed || probe.kind === "voice",
    probes: [...state.probes, probe],
    log: [...state.log, { ...item, channel: "dm" }],
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "start":
      return createGame(action.seed);
    case "title":
      return { ...initialState };
    case "hydrate":
      return action.state;
    case "select":
      if (state.screen !== "play") return state;
      return { ...state, selected: action.id };
    case "mark": {
      if (!state.assignments[action.id]) return state;
      const marks = { ...state.marks };
      if (marks[action.id] === action.mark) delete marks[action.id];
      else marks[action.id] = action.mark;
      return { ...state, marks };
    }
    case "note": {
      if (!state.assignments[action.id]) return state;
      const notes = { ...state.notes, [action.id]: action.text.slice(0, 40) };
      return { ...state, notes };
    }
    case "dm":
    case "archive":
    case "voice":
    case "cross": {
      if (state.screen !== "play" || state.probesLeft <= 0) return state;
      const personaId = state.selected;
      if (!personaId || !living(state, personaId)) return state;
      if (action.type === "voice" && state.voiceUsed) return state;
      if (action.type === "cross") {
        if (!living(state, action.targetId) || action.targetId === personaId) return state;
        if (state.probes.some((probe) => probe.kind === "cross" && probe.personaId === personaId && probe.targetId === action.targetId)) {
          return state;
        }
      }
      if (action.type === "archive" && state.probes.some((probe) => probe.kind === "archive" && probe.personaId === personaId)) {
        return state;
      }
      if (action.type === "voice" && state.probes.some((probe) => probe.kind === "voice" && probe.personaId === personaId)) {
        return state;
      }
      if (action.type === "dm" && state.probes.some((probe) => probe.kind === "dm" && probe.personaId === personaId && probe.questionId === action.questionId)) {
        return state;
      }
      const inner = innerOf(state, personaId);
      const salt = state.seed + state.probes.length * 13;
      if (action.type === "dm") {
        return pushProbe(
          state,
          { personaId, kind: "dm", questionId: action.questionId },
          {
            id: `dm-${state.seed}-${state.probes.length}`,
            kind: "dm",
            day: state.day,
            personaId,
            questionId: action.questionId,
            text: speak(personaId, inner.dm[action.questionId], salt),
          },
        );
      }
      if (action.type === "archive") {
        return pushProbe(
          state,
          { personaId, kind: "archive" },
          {
            id: `arc-${state.seed}-${state.probes.length}`,
            kind: "archive",
            day: state.day,
            personaId,
            text: inner.archive,
          },
        );
      }
      if (action.type === "voice") {
        return pushProbe(
          state,
          { personaId, kind: "voice" },
          {
            id: `voice-${state.seed}-${state.probes.length}`,
            kind: "voice",
            day: state.day,
            personaId,
            text: inner.voice,
          },
        );
      }
      const target = PERSONAS.find((persona) => persona.id === action.targetId);
      return pushProbe(
        state,
        { personaId, kind: "cross", targetId: action.targetId },
        {
          id: `cross-${state.seed}-${state.probes.length}`,
          kind: "cross",
          day: state.day,
          personaId,
          targetId: action.targetId,
          text: speak(personaId, inner.cross.replaceAll("{name}", target?.name ?? ""), salt),
        },
      );
    }
    case "vote":
      return finishDay(state, action.id);
    case "endDay":
      return finishDay(state, null);
    default:
      return state;
  }
}

export function rankLabel(score: number, win: boolean): string {
  if (!win) return "おじさんの勝ち";
  if (score >= 1600) return "伝説のリスナー";
  if (score >= 1400) return "耳がいい";
  if (score >= 1200) return "見破った";
  return "なんとか正解";
}
