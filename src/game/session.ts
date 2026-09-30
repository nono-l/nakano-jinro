import { CHANNELS, INNERS, PERSONAS, type ChannelId } from "./content";
import type { GameState } from "./engine";

const KEY = "nakano-session";
const VERSION = 1;

const KINDS = new Set(["chat", "dm", "archive", "voice", "cross", "kick", "leave", "join", "image", "stamp", "system"]);

export type Session = {
  state: GameState;
  channel: ChannelId;
};

function isChannel(value: unknown): value is ChannelId {
  return CHANNELS.some((item) => item.id === value);
}

function isState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as GameState;
  if (state.screen !== "play" && state.screen !== "result") return false;
  if (typeof state.seed !== "number" || typeof state.day !== "number" || state.day < 0 || state.day > 2) return false;
  if (typeof state.probesLeft !== "number" || typeof state.voiceUsed !== "boolean") return false;
  if (!Array.isArray(state.log) || !Array.isArray(state.probes) || !Array.isArray(state.exiled)) return false;
  if (!state.assignments || typeof state.assignments !== "object") return false;
  if (!state.marks || typeof state.marks !== "object" || !state.notes || typeof state.notes !== "object") return false;
  const people = new Set(PERSONAS.map((persona) => persona.id));
  const inners = Object.keys(INNERS);
  const assigned = Object.entries(state.assignments);
  if (assigned.length !== people.size) return false;
  if (assigned.some(([id, inner]) => !people.has(id) || !inners.includes(inner))) return false;
  if (assigned.filter(([, inner]) => inner === "girl").length !== 1) return false;
  if (state.exiled.some((id) => !people.has(id))) return false;
  if (state.log.some((item) => !item || typeof item.id !== "string" || !KINDS.has(item.kind))) return false;
  if (state.screen === "result" && (!state.result || typeof state.result.win !== "boolean")) return false;
  return true;
}

export function loadSession(): Session | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; state?: unknown; channel?: unknown };
    if (parsed.v !== VERSION || !isState(parsed.state)) return null;
    if (!Array.isArray(parsed.state.pins)) parsed.state.pins = [];
    return { state: parsed.state, channel: isChannel(parsed.channel) ? parsed.channel : "zatsu" };
  } catch {
    return null;
  }
}

export function saveSession(state: GameState, channel: ChannelId): void {
  if (typeof localStorage === "undefined") return;
  if (state.screen === "title") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, state, channel }));
  } catch {
    // The browser can refuse the write. The match simply will not resume.
  }
}

export function clearSession(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
