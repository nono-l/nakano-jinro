import { useEffect, useReducer, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Archive,
  BookOpen,
  Hash,
  MessageCircle,
  Mic,
  Search,
  UserX,
  Users,
  X,
  RotateCcw,
} from "lucide-react";
import {
  CHANNELS,
  DAYS,
  INNERS,
  PERSONAS,
  QUESTIONS,
  personaById,
  type ChannelId,
  type QuestionId,
} from "@/game/content";
import {
  initialState,
  rankLabel,
  reducer,
  type Action,
  type GameState,
  type LogItem,
  type Mark,
} from "@/game/engine";
import { loadStats, saveResult, type Stats } from "@/game/stats";
import { clearSession, loadSession, saveSession } from "@/game/session";

type Modal = null | "rules" | "coach" | "dm" | "cross" | "end";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Face({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} draggable={false} className={cx("object-cover", className)} />;
}

export function GameApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState<Stats | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [onlySelected, setOnlySelected] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelId>("zatsu");
  const [ready, setReady] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const logCursor = useRef(0);
  const prevScreen = useRef(state.screen);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      logCursor.current = saved.state.log.length;
      setChannel(saved.channel);
      dispatch({ type: "hydrate", state: saved.state });
    }
    setStats(loadStats());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (state.screen === "title") clearSession();
    else saveSession(state, channel);
  }, [ready, state, channel]);

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    const last = state.log[state.log.length - 1];
    if (!last) return;
    if (last.kind === "chat" || last.kind === "system") {
      const align = (el: Element) => {
        node.scrollTop += el.getBoundingClientRect().top - node.getBoundingClientRect().top - 8;
      };
      const kicks = node.querySelectorAll("[data-kind='kick']");
      const kick = kicks[kicks.length - 1];
      if (kick?.getAttribute("data-day") === String(state.day - 1)) {
        align(kick);
        return;
      }
      const denied = [...node.querySelectorAll("[data-kind='system']")].filter((el) => el.getAttribute("data-day") === String(state.day - 1));
      if (denied.length > 0) {
        align(denied[0]);
        return;
      }
      const nights = node.querySelectorAll("[data-kind='leave']");
      const night = nights[nights.length - 1];
      if (night?.getAttribute("data-day") === String(state.day - 1)) {
        align(night);
        return;
      }
      const markers = node.querySelectorAll("[data-kind='system']");
      const sys = markers[markers.length - 1];
      if (sys) align(sys);
      return;
    }
    node.scrollTo({ top: node.scrollHeight });
  }, [state.log.length, state.screen, channel]);

  useEffect(() => {
    const entered = prevScreen.current !== "play" && state.screen === "play";
    prevScreen.current = state.screen;
    if (state.screen !== "play") {
      logCursor.current = 0;
      return;
    }
    if (entered) {
      logCursor.current = state.log.length;
      return;
    }
    const fresh = state.log.slice(logCursor.current);
    logCursor.current = state.log.length;
    if (fresh.some((item) => item.kind === "leave")) setChannel("join");
    else if (fresh.some((item) => item.kind === "kick")) setChannel("zatsu");
    else if (fresh.some((item) => item.kind === "dm" || item.kind === "archive" || item.kind === "voice" || item.kind === "cross")) setChannel("dm");
  }, [state.log.length, state.screen, state.log]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 2200);
    return () => window.clearTimeout(timer);
  }, [banner]);

  function send(action: Action) {
    const next = reducer(state, action);
    if (next.result && !state.result) setStats(saveResult(next.result.win, next.result.score));
    if (action.type === "start") {
      setOnlySelected(false);
      setDraft(null);
      setModal(localStorage.getItem("nakano-coach") ? null : "coach");
    } else if (next.screen !== "play") {
      setModal(null);
    }
    dispatch(action);
  }

  function start() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    setChannel("zatsu");
    send({ type: "start", seed: buf[0] || 1 });
  }

  function restart() {
    if (!window.confirm("いまの配信を消して、最初からにしますか？")) return;
    start();
  }

  function needTarget(): boolean {
    if (!state.selected) {
      setBanner("先に、話しかける子を選んで");
      return true;
    }
    if (state.exiled.includes(state.selected)) {
      setBanner("この子は、もうサーバーにいない");
      return true;
    }
    if (state.probesLeft <= 0) {
      setBanner("今日の調査は、もう使った");
      return true;
    }
    return false;
  }

  return (
    <>
      {!ready ? <div className="h-dvh bg-[#1e1f22]" /> : null}
      {ready && state.screen === "title" ? (
        <TitleScreen stats={stats} onStart={start} onRules={() => setModal("rules")} />
      ) : null}
      {ready && state.screen === "play" ? (
        <PlayScreen
          state={state}
          logRef={logRef}
          channel={channel}
          onChannel={setChannel}
          onlySelected={onlySelected}
          banner={banner}
          onToggleFilter={() => setOnlySelected((value) => !value)}
          onSelect={(id) => send({ type: "select", id })}
          onMark={(id, mark) => send({ type: "mark", id, mark })}
          onNote={(id, text) => send({ type: "note", id, text })}
          onTool={(kind) => {
            if (needTarget()) return;
            if (kind === "dm") setModal("dm");
            else if (kind === "cross") setModal("cross");
            else if (kind === "archive") send({ type: "archive" });
            else if (state.voiceUsed) setBanner("マイク事故は、1日1回まで");
            else send({ type: "voice" });
          }}
          onEnd={() => {
            setDraft(null);
            setModal("end");
          }}
          onRestart={restart}
          onRules={() => setModal("rules")}
        />
      ) : null}
      {ready && state.screen === "result" && state.result ? (
        <ResultScreen
          state={state}
          onAgain={start}
          onTitle={() => send({ type: "title" })}
        />
      ) : null}
      {modal ? (
        <ModalShell
          onClose={() => {
            if (modal === "coach") localStorage.setItem("nakano-coach", "1");
            setModal(null);
            setDraft(null);
          }}
        >
          {modal === "rules" ? <Rules onClose={() => setModal(null)} /> : null}
          {modal === "coach" ? (
            <Coach
              onClose={() => {
                localStorage.setItem("nakano-coach", "1");
                setModal(null);
              }}
            />
          ) : null}
          {modal === "dm" && state.selected ? (
            <QuestionSheet
              state={state}
              onPick={(questionId) => {
                send({ type: "dm", questionId });
                setModal(null);
              }}
            />
          ) : null}
          {modal === "cross" && state.selected ? (
            <CrossSheet
              state={state}
              onPick={(targetId) => {
                send({ type: "cross", targetId });
                setModal(null);
              }}
            />
          ) : null}
          {modal === "end" ? (
            <ExileSheet
              state={state}
              draft={draft}
              setDraft={setDraft}
              onSkip={() => {
                send({ type: "endDay" });
                setModal(null);
              }}
              onConfirm={() => {
                if (!draft) return;
                send({ type: "vote", id: draft });
                setModal(null);
                setDraft(null);
              }}
            />
          ) : null}
        </ModalShell>
      ) : null}
    </>
  );
}

function TitleScreen({ stats, onStart, onRules }: { stats: Stats | null; onStart: () => void; onRules: () => void }) {
  const wins = stats && stats.plays > 0 ? Math.round((stats.wins / stats.plays) * 100) : null;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-bg p-6 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-ink">狼</div>
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-muted">サーバーへ招待されました</p>
        <h1 className="mt-1 text-center text-2xl font-bold text-fg">なかのひと人狼</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          美少女VTuberは10人。中の人は、9人がおじさん。本物はひとりだけ。
          夜になると一人がサーバーを抜け、過半数の投票で Bot がキックする。本物をキックしたらクリア。
        手がかりは、入退室と画像とスタンプに落ちている。
        </p>
        <div className="mt-4 flex justify-center -space-x-2">
          {PERSONAS.slice(0, 6).map((persona) => (
            <Face key={persona.id} src={persona.image} alt="" className="h-9 w-9 rounded-full ring-2 ring-bg" />
          ))}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-bold text-fg ring-2 ring-bg">+4</span>
        </div>
        <button
          type="button"
          data-testid="start-game"
          onClick={onStart}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary text-base font-medium text-primary-ink"
        >
          サーバーに参加
        </button>
        <button
          type="button"
          data-testid="open-rules"
          onClick={onRules}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-medium text-fg hover:underline"
        >
          ルールを見る
        </button>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
          <Stat label="ベスト" value={stats ? String(stats.best) : "—"} />
          <Stat label="連勝" value={stats ? String(stats.streak) : "—"} />
          <Stat label="的中" value={wins === null ? "—" : `${wins}%`} />
        </dl>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-fg">{value}</dd>
    </div>
  );
}

function PlayScreen({
  state,
  logRef,
  channel,
  onChannel,
  onlySelected,
  banner,
  onToggleFilter,
  onSelect,
  onMark,
  onNote,
  onTool,
  onEnd,
  onRestart,
  onRules,
}: {
  state: GameState;
  logRef: RefObject<HTMLDivElement | null>;
  channel: ChannelId;
  onChannel: (id: ChannelId) => void;
  onlySelected: boolean;
  banner: string | null;
  onToggleFilter: () => void;
  onSelect: (id: string) => void;
  onMark: (id: string, mark: Mark) => void;
  onNote: (id: string, text: string) => void;
  onTool: (kind: "dm" | "archive" | "voice" | "cross") => void;
  onEnd: () => void;
  onRestart: () => void;
  onRules: () => void;
}) {
  const day = DAYS[state.day] ?? DAYS[0];
  const aliveCount = PERSONAS.length - state.exiled.length;
  const selected = state.selected ? personaById(state.selected) : null;
  const current = CHANNELS.find((item) => item.id === channel) ?? CHANNELS[0];
  const [seen, setSeen] = useState<Partial<Record<ChannelId, number>>>({});
  useEffect(() => {
    setSeen({});
  }, [state.seed]);
  useEffect(() => {
    const count = state.log.filter((item) => (item.channel ?? "zatsu") === channel).length;
    setSeen((prev) => (prev[channel] === count ? prev : { ...prev, [channel]: count }));
  }, [channel, state.log, state.seed]);
  const visible = state.log.filter((item) => (item.channel ?? "zatsu") === channel && (!onlySelected || !item.personaId || item.personaId === state.selected || item.targetId === state.selected));
  const unread = (id: ChannelId) => {
    const count = state.log.filter((item) => (item.channel ?? "zatsu") === id).length;
    return id !== channel && count > (seen[id] ?? 0);
  };

  return (
    <div className="flex h-dvh w-full bg-[#1e1f22] text-fg">
      <nav className="hidden w-[72px] shrink-0 flex-col items-center gap-2 bg-[#1e1f22] py-3 md:flex" aria-label="サーバー">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-ink">狼</div>
        <span className="h-0.5 w-8 rounded-full bg-line" />
        <button type="button" onClick={onRules} className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-2 text-accent" aria-label="ルール">
          <BookOpen className="h-5 w-5" aria-hidden />
        </button>
      </nav>

      <aside className="hidden w-60 shrink-0 flex-col bg-bg-2 lg:flex">
        <div className="flex h-12 items-center border-b border-black/20 px-4 text-sm font-bold text-fg shadow-sm">なかのひと人狼</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <p className="px-2 text-xs font-bold text-muted">テキストチャンネル</p>
          <ul className="mt-1 space-y-0.5">
            {CHANNELS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChannel(item.id)}
                  className={cx(
                    "flex min-h-11 w-full items-center gap-1.5 rounded px-2 text-left text-sm",
                    channel === item.id ? "bg-surface font-medium text-fg" : "text-muted hover:bg-surface/60 hover:text-fg",
                  )}
                >
                  <Hash className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.name}</span>
                  {unread(item.id) ? <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-fg" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onRestart} className="mx-2 mt-2 inline-flex min-h-11 items-center rounded px-2 text-sm text-muted hover:bg-surface hover:text-fg">
          最初から
        </button>
        <button type="button" onClick={onRules} className="m-2 inline-flex min-h-11 items-center gap-2 rounded px-2 text-sm text-muted hover:bg-surface hover:text-fg">
          <BookOpen className="h-4 w-4" aria-hidden />
          ルール
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-bg">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-3 shadow-sm">
          <Hash className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-fg">{current?.name}</p>
          </div>
          <p className="hidden min-w-0 flex-1 truncate text-xs text-muted sm:block">{current?.topic}</p>
          <button
            type="button"
            onClick={onToggleFilter}
            className={cx("min-h-11 shrink-0 rounded px-2 text-xs", onlySelected ? "bg-primary text-primary-ink" : "text-muted")}
          >
            選択中だけ
          </button>
          <span className="hidden text-xs text-muted sm:inline">{day.label}</span>
          <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex">
            <Users className="h-4 w-4" aria-hidden />
            {aliveCount}
          </span>
          <button type="button" onClick={onRestart} className="inline-flex min-h-11 items-center px-2 text-xs text-muted lg:hidden">
            最初から
          </button>
          <button type="button" onClick={onRules} className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted lg:hidden" aria-label="ルール">
            <BookOpen className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-black/20 px-2 py-1 lg:hidden">
          {CHANNELS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChannel(item.id)}
              className={cx(
                "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-xs",
                channel === item.id ? "bg-surface font-medium text-fg" : "text-muted",
              )}
            >
              <Hash className="h-3.5 w-3.5" aria-hidden />
              {item.name}
              {unread(item.id) ? <span className="h-1.5 w-1.5 rounded-full bg-fg" /> : null}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <MemberList state={state} onSelect={onSelect} className="order-1 xl:order-2" />
          <div className="order-2 flex min-h-0 flex-1 flex-col xl:order-1">
            <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto py-2" aria-live="polite">
              {visible.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted">
                  {channel === "dm" ? "スラッシュコマンドの結果は、ここに残る。" : "このチャンネルには、まだログがない。"}
                </p>
              ) : null}
              {visible.map((item, index) => (
                <LogRow key={item.id} item={item} stamp={stampFor(item, index)} onSelect={onSelect} />
              ))}
            </div>
            {selected ? (
              <SelectedPanel state={state} personaId={selected.id} onMark={onMark} onNote={onNote} />
            ) : (
              <p className="px-4 pb-1 text-xs text-muted">メンバーかアイコンを押すと、疑う・メモできる。</p>
            )}
            <footer className="shrink-0 px-3 pb-3 pt-1">
              {banner ? <p className="mb-2 rounded bg-[#f0b232]/15 px-3 py-2 text-sm text-[#fee75c]">{banner}</p> : null}
              <div className="mb-2 flex gap-2 overflow-x-auto">
                <ToolButton testId="tool-dm" icon={<Search className="h-3.5 w-3.5" aria-hidden />} label="/質問" onClick={() => onTool("dm")} disabled={state.probesLeft <= 0} />
                <ToolButton testId="tool-archive" icon={<Archive className="h-3.5 w-3.5" aria-hidden />} label="/過去" onClick={() => onTool("archive")} disabled={state.probesLeft <= 0} />
                <ToolButton testId="tool-voice" icon={<Mic className="h-3.5 w-3.5" aria-hidden />} label="/事故" onClick={() => onTool("voice")} disabled={state.probesLeft <= 0 || state.voiceUsed} />
                <ToolButton testId="tool-cross" icon={<MessageCircle className="h-3.5 w-3.5" aria-hidden />} label="/印象" onClick={() => onTool("cross")} disabled={state.probesLeft <= 0} />
              </div>
              <div className="flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3">
                <p className="min-w-0 flex-1 truncate text-sm text-muted">
                  調査残り {state.probesLeft}
                  {state.voiceUsed ? "　事故は使用済み" : ""}
                </p>
                <button
                  type="button"
                  data-testid="end-day"
                  onClick={onEnd}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded bg-[#da373c] px-3 text-sm font-medium text-white"
                >
                  <UserX className="h-4 w-4" aria-hidden />
                  キック投票
                </button>
              </div>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}

function stampFor(item: LogItem, index: number) {
  const hour = 19 + item.day;
  const minute = String((index * 3) % 60).padStart(2, "0");
  return `今日 ${hour}:${minute}`;
}

function MemberList({ state, onSelect, className }: { state: GameState; onSelect: (id: string) => void; className?: string }) {
  const online = PERSONAS.filter((persona) => !state.exiled.includes(persona.id));
  const offline = PERSONAS.filter((persona) => state.exiled.includes(persona.id));
  return (
    <aside className={cx("flex max-h-28 shrink-0 gap-1 overflow-x-auto border-b border-black/20 bg-bg px-2 py-2 xl:max-h-none xl:w-60 xl:flex-col xl:overflow-y-auto xl:border-b-0 xl:border-l xl:bg-bg-2", className)}>
      <p className="hidden px-2 pt-3 text-xs font-bold text-muted xl:block">オンライン — {online.length}</p>
      {online.map((persona) => (
        <MemberButton key={persona.id} state={state} personaId={persona.id} onSelect={onSelect} />
      ))}
      {offline.length > 0 ? <p className="hidden px-2 pt-3 text-xs font-bold text-muted xl:block">オフライン — {offline.length}</p> : null}
      {offline.map((persona) => (
        <MemberButton key={persona.id} state={state} personaId={persona.id} onSelect={onSelect} />
      ))}
    </aside>
  );
}

function MemberButton({ state, personaId, onSelect }: { state: GameState; personaId: string; onSelect: (id: string) => void }) {
  const persona = personaById(personaId);
  const gone = state.exiled.includes(personaId);
  const inner = INNERS[state.assignments[personaId] ?? ""];
  const mark = state.marks[personaId];
  const active = state.selected === personaId;
  const face = gone && inner?.portrait ? inner.portrait : persona.image;
  const label = gone ? inner?.codename ?? persona.name : persona.name;
  return (
    <button
      type="button"
      data-testid={`cast-${persona.id}`}
      onClick={() => onSelect(persona.id)}
      className={cx(
        "flex w-14 shrink-0 flex-col items-center gap-1 rounded px-1 py-1 xl:w-auto xl:flex-row xl:gap-2 xl:px-2",
        active ? "bg-surface" : "xl:hover:bg-surface/70",
        gone ? "opacity-60" : "",
      )}
    >
      <span className="relative">
        <Face src={face} alt="" className={cx("h-10 w-10 rounded-full", gone ? "grayscale" : "")} />
        <span className={cx("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg", gone ? "bg-muted" : "bg-accent")} />
      </span>
      <span className="w-full truncate text-center text-[10px] text-fg xl:text-left xl:text-sm" style={gone ? undefined : { color: persona.color }}>
        {label}
      </span>
      {mark && !gone ? (
        <span className={cx("hidden rounded px-1 text-[10px] font-bold xl:inline", mark === "sus" ? "bg-primary text-primary-ink" : "bg-accent text-accent-ink")}>
          {mark === "sus" ? "疑" : "白"}
        </span>
      ) : null}
      {gone ? <span className="hidden text-[10px] text-muted xl:inline">{state.fate[personaId] === "eaten" ? "退出" : "キック"}</span> : null}
    </button>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  testId,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-surface px-3 text-xs font-medium text-fg disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

function SelectedPanel({
  state,
  personaId,
  onMark,
  onNote,
}: {
  state: GameState;
  personaId: string;
  onMark: (id: string, mark: Mark) => void;
  onNote: (id: string, text: string) => void;
}) {
  const persona = personaById(personaId);
  const exiled = state.exiled.includes(personaId);
  const inner = INNERS[state.assignments[personaId] ?? ""];
  const probes = state.probes.filter((probe) => probe.personaId === personaId);
  return (
    <div className="mx-3 rounded-lg bg-bg-2 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" style={{ color: persona.color }}>{persona.name}</p>
          <p className="truncate text-xs text-muted">{persona.tag}　{persona.handle}</p>
        </div>
        {exiled && inner ? (
          <p className="shrink-0 text-xs font-bold text-[#ed4245]">
            {state.fate[personaId] === "eaten" ? "退出" : "キック"}・{inner.codename}
          </p>
        ) : null}
      </div>
      {!exiled ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onMark(personaId, "sus")}
            className={cx("min-h-11 flex-1 rounded text-sm font-medium", state.marks[personaId] === "sus" ? "bg-primary text-primary-ink" : "bg-surface text-fg")}
          >
            疑う
          </button>
          <button
            type="button"
            onClick={() => onMark(personaId, "safe")}
            className={cx("min-h-11 flex-1 rounded text-sm font-medium", state.marks[personaId] === "safe" ? "bg-accent text-accent-ink" : "bg-surface text-fg")}
          >
            清白
          </button>
        </div>
      ) : null}
      <label className="mt-2 block text-xs text-muted">
        メモ
        <input
          value={state.notes[personaId] ?? ""}
          onChange={(event) => onNote(personaId, event.target.value)}
          maxLength={40}
          placeholder="気になった言葉"
          className="mt-1 min-h-11 w-full rounded bg-bg px-3 text-sm text-fg outline-none"
        />
      </label>
      {probes.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {probes.map((probe, index) => (
            <li key={`${probe.kind}-${index}`} className="rounded bg-bg px-2 py-0.5 text-xs text-accent">
              {probeLabel(probe.kind, probe.questionId)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function probeLabel(kind: string, questionId?: QuestionId) {
  if (kind === "dm") return QUESTIONS.find((item) => item.id === questionId)?.label ?? "質問";
  if (kind === "archive") return "過去配信";
  if (kind === "voice") return "マイク事故";
  return "印象";
}

function LogRow({ item, stamp, onSelect }: { item: LogItem; stamp: string; onSelect: (id: string) => void }) {
  if (item.kind === "system") {
    return (
      <div data-kind="system" data-day={item.day} className="msg-in flex items-center gap-3 px-4 py-2">
        <span className="h-px flex-1 bg-line" />
        <p className="max-w-[70%] text-center text-xs font-medium text-muted">{item.text}</p>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  if ((item.kind === "join" || item.kind === "leave") && item.personaId) {
    const persona = personaById(item.personaId);
    const inner = item.innerId ? INNERS[item.innerId] : undefined;
    const left = item.kind === "leave";
    return (
      <article data-kind={item.kind} data-day={item.day} className="msg-in px-4 py-1">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center text-lg text-muted">{left ? "←" : "→"}</div>
          <div className="min-w-0 pt-1">
            <p className="text-sm text-muted">
              <button type="button" onClick={() => onSelect(persona.id)} className="font-medium text-fg hover:underline">{persona.name}</button>
              {left ? " がサーバーを退出しました" : " がサーバーに参加しました"}
            </p>
            <p className="text-sm text-fg">{left ? `「${item.text}」` : item.text}</p>
          </div>
        </div>
        {left && inner ? (
          <div className="ml-[52px] mt-1 flex max-w-xl gap-2">
            <Face src={persona.image} alt="" className="h-12 w-12 rounded-full opacity-80" />
            {inner.portrait ? <Face src={inner.portrait} alt={inner.codename} className="h-12 w-12 rounded-full" /> : null}
            <p className="text-sm text-fg">夜に喰われた。中の人は{inner.age}の{inner.codename}。本物はまだいる。</p>
          </div>
        ) : null}
      </article>
    );
  }
  if (item.kind === "image" && item.personaId) {
    const persona = personaById(item.personaId);
    return (
      <article className="msg-in flex gap-3 px-4 py-1 hover:bg-black/10">
        <button type="button" onClick={() => onSelect(persona.id)} className="h-10 w-10 shrink-0">
          <Face src={persona.image} alt="" className="h-10 w-10 rounded-full" />
        </button>
        <div className="min-w-0">
          <p className="text-sm">
            <button type="button" onClick={() => onSelect(persona.id)} className="font-medium hover:underline" style={{ color: persona.color }}>{persona.name}</button>
            <span className="ml-2 text-xs text-muted">{stamp}</span>
          </p>
          <p className="text-[15px] leading-snug text-fg">{item.text}</p>
          {item.image ? <img src={item.image} alt="" className="mt-2 max-h-72 w-full max-w-sm rounded-lg object-cover" /> : null}
        </div>
      </article>
    );
  }
  if (item.kind === "stamp" && item.personaId) {
    const persona = personaById(item.personaId);
    return (
      <article className="msg-in flex gap-3 px-4 py-1 hover:bg-black/10">
        <button type="button" onClick={() => onSelect(persona.id)} className="h-10 w-10 shrink-0">
          <Face src={persona.image} alt="" className="h-10 w-10 rounded-full" />
        </button>
        <div className="min-w-0">
          <p className="text-sm">
            <button type="button" onClick={() => onSelect(persona.id)} className="font-medium hover:underline" style={{ color: persona.color }}>{persona.name}</button>
            <span className="ml-2 text-xs text-muted">{stamp}</span>
          </p>
          <div className="mt-1 inline-flex max-w-xl items-center gap-3 rounded-lg bg-bg-2 px-3 py-2">
            <span className="text-4xl leading-none">{item.stamp}</span>
            <p className="text-sm text-fg">{item.text}</p>
          </div>
        </div>
      </article>
    );
  }
  if (item.kind === "kick" && item.personaId && item.innerId) {
    const persona = personaById(item.personaId);
    const inner = INNERS[item.innerId];
    const total = item.votes?.reduce((sum, row) => sum + row.count, 0) ?? 0;
    const top = item.votes?.[0]?.count ?? 0;
    const girl = inner?.id === "girl";
    const max = Math.max(...(item.votes?.map((row) => row.count) ?? [1]));
    return (
      <article data-kind="kick" data-day={item.day} className="msg-in flex gap-3 px-4 py-1 hover:bg-bg-2/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-ink">N</div>
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-medium text-fg">NAKANO-BOT</span>
            <span className="ml-1 rounded bg-primary px-1 text-[10px] font-bold text-primary-ink">BOT</span>
            <span className="ml-2 text-xs text-muted">{stamp}</span>
          </p>
          <div className="mt-1 max-w-xl rounded border-l-4 border-primary bg-bg-2 px-3 py-2">
            <p className="text-sm font-medium text-fg">キック投票</p>
            <ul className="mt-2 space-y-1.5">
              {item.votes?.map((row) => (
                <li key={row.id} className="text-sm text-fg">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{personaById(row.id).name}</span>
                    <span className="font-medium">{row.count}</span>
                  </div>
                  <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-medium text-primary">過半数 {top}/{total}</p>
            <p className="mt-1 text-sm text-fg">{persona.name} をサーバーからキックしました</p>
            {girl ? (
              <p className="mt-1 text-sm font-medium text-accent">キックされたのは、本物。</p>
            ) : (
              <div className="mt-2 flex gap-2">
                <Face src={persona.image} alt="" className="h-12 w-12 rounded-full" />
                {inner?.portrait ? <Face src={inner.portrait} alt={inner.codename} className="h-12 w-12 rounded-full" /> : null}
                <p className="text-sm text-fg">中の人は{inner?.age}の{inner?.codename}。本物は、まだいる。</p>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }
  const persona = item.personaId ? personaById(item.personaId) : null;
  const factual = item.kind !== "chat";
  const kicker =
    item.kind === "dm" ? "質問・事実" : item.kind === "archive" ? "過去配信・事実" : item.kind === "voice" ? "マイク事故・事実" : item.kind === "cross" ? "印象・この子の本音" : null;
  return (
    <article className="msg-in flex gap-3 px-4 py-1 hover:bg-black/10">
      {persona ? (
        <button type="button" onClick={() => onSelect(persona.id)} className="h-10 w-10 shrink-0">
          <Face src={persona.image} alt="" className="h-10 w-10 rounded-full" />
        </button>
      ) : (
        <span className="w-10 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm">
          {persona ? (
            <button type="button" onClick={() => onSelect(persona.id)} className="font-medium hover:underline" style={{ color: persona.color }}>
              {persona.name}
            </button>
          ) : null}
          {item.kind === "cross" && item.targetId ? <span className="text-muted"> → {personaById(item.targetId).name}</span> : null}
          <span className="ml-2 text-xs text-muted">{stamp}</span>
        </p>
        {factual ? (
          <div className="mt-1 max-w-xl rounded border-l-4 border-accent bg-bg-2 px-3 py-2">
            {kicker ? <p className="mb-1 text-xs font-bold text-accent">{kicker}</p> : null}
            {item.kind === "dm" && item.questionId ? (
              <p className="mb-1 text-xs text-muted">{QUESTIONS.find((question) => question.id === item.questionId)?.ask}</p>
            ) : null}
            <p className="text-sm leading-relaxed text-fg">{item.text}</p>
          </div>
        ) : (
          <>
            {item.slot ? <p className="text-[10px] font-bold tracking-wide text-muted">{item.slot}</p> : null}
            <p className="text-[15px] leading-snug text-fg">{item.text}</p>
          </>
        )}
      </div>
    </article>
  );
}

function ResultScreen({ state, onAgain, onTitle }: { state: GameState; onAgain: () => void; onTitle: () => void }) {
  const result = state.result;
  const girlId = Object.entries(state.assignments).find(([, inner]) => inner === "girl")?.[0];
  const ordered = PERSONAS.filter((persona) => persona.id !== girlId);
  const girl = girlId ? personaById(girlId) : null;
  const cards = girl ? [girl, ...ordered] : ordered;
  const kickLog = [...state.log].reverse().find((item) => item.kind === "kick");
  if (!result) return null;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 sm:px-6">
      <p className="text-xs font-bold tracking-wide text-primary" data-testid="result-title">
        {result.win ? "CLEAR" : "MISS"}
      </p>
      <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">{rankLabel(result.score, result.win)}</h1>
      <p className="mt-3 max-w-xl text-base text-muted">
        {result.win
          ? result.reason === "last"
            ? "ほかは全員いなくなって、残ったのが本物だった。"
            : "過半数が集まって、Botが本物をキックした。"
          : "最後まで、本物はキックされなかった。"}
      </p>
      {result.win ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {result.breakdown.map((row) => (
            <li key={row.label} className="rounded-xl bg-surface px-3 py-2 text-sm text-fg">
              {row.label} <span className="font-bold text-accent">+{row.value}</span>
            </li>
          ))}
          <li className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-accent-ink">合計 {result.score}</li>
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">スコア 0</p>
      )}
      {kickLog?.votes ? (
        <div className="mt-4 max-w-sm rounded-2xl border border-line bg-bg-2 px-3 py-3">
          <p className="text-xs font-bold tracking-wide text-muted">NAKANO-BOT</p>
          <ul className="mt-2 space-y-1">
            {kickLog.votes.map((row) => (
              <li key={row.id} className="flex items-center justify-between text-sm text-fg">
                <span>{personaById(row.id).name}</span>
                <span className="font-bold">{row.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs font-bold text-primary">過半数 {kickLog.text}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((persona) => {
          const inner = INNERS[state.assignments[persona.id] ?? ""];
          if (!inner) return null;
          const isGirl = inner.id === "girl";
          const picked = result.pickedId === persona.id;
          return (
            <article
              key={persona.id}
              className={cx(
                "overflow-hidden rounded-2xl border bg-surface",
                isGirl ? "border-accent sm:col-span-2" : "border-line",
                picked && !result.win ? "border-primary" : "",
              )}
            >
              <div className={cx("grid", isGirl ? "sm:grid-cols-[180px_1fr]" : "grid-cols-[96px_1fr]")}>
                <Face
                  src={isGirl ? persona.image : inner.portrait || persona.image}
                  alt={isGirl ? persona.name : inner.codename}
                  className="h-full w-full aspect-square"
                />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted">{isGirl ? "本物" : `${persona.name} の中の人`}</p>
                      <h2 className="text-lg font-bold text-fg">
                        {isGirl ? persona.name : `${inner.age} ${inner.codename}`}
                      </h2>
                    </div>
                    {!isGirl ? <Face src={persona.image} alt="" className="h-12 w-12 rounded-xl" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{inner.role}</p>
                  <p className="mt-2 text-sm text-fg">「{inner.quote}」</p>
                  <p className="mt-2 text-xs text-accent">漏れ：{inner.leak}</p>
                  {state.fate[persona.id] === "eaten" ? <p className="mt-2 text-xs text-muted">夜に喰われて、Discordを退出</p> : null}
                  {state.fate[persona.id] === "kick" ? <p className="mt-2 text-xs text-muted">Botにキックされた</p> : null}
                  {picked ? (
                    <p className="mt-2 text-xs font-bold text-primary">
                      {result.win && result.reason === "kick" ? "過半数でキック" : result.win ? "最後に残った" : "外した投票"}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" data-testid="play-again" onClick={onAgain} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-ink">
          <RotateCcw className="h-4 w-4" aria-hidden />
          もう一度（中の人は入れ替わる）
        </button>
        <button type="button" onClick={onTitle} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line bg-surface px-6 font-medium text-fg">
          タイトルへ
        </button>
      </div>
    </main>
  );
}

function ModalShell({
  children,
  onClose,
  locked,
}: {
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-lg bg-bg p-4">
        {!locked ? (
          <div className="mb-2 flex justify-end">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted" aria-label="閉じる">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Rules({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-fg">ルール</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg">
        <li>10人の美少女のうち、本物の女の子はひとり。あとの9人はおじさん。組み合わせは毎局変わる。</li>
        <li>公開チャットは可愛く演じている。にゃん、などの口調はアバターのキャラで、証拠ではない。</li>
        <li>手がかりの型は300以上。入退室、プロフィール、画像、スタンプ、リアクションのどれに出るかは、毎回変わる。日が進むと、強いログが増える。</li>
        <li>調査は1日2回まで。質問・過去配信・印象は、聞いた本人の生活が事実として出る。マイク事故は1日1回。</li>
        <li>印象は、聞かれた子の本音が漏れる。話題にした相手の正体とは限らない。</li>
        <li>日を終えると夜になる。本物がおじさんを一人喰い、その子はDiscordを退出する。抜けた子はおじさん確定。本物は残る。</li>
        <li>キック投票で過半数を取った子を、Botがサーバーからキックする。キックされたのが本物ならクリア。</li>
        <li>おじさんをキックしても負けにはならない。その子が抜けるだけ。3日目が終わるまでに本物をキックできないと失敗。</li>
      </ul>
      <button type="button" onClick={onClose} className="mt-4 min-h-11 w-full rounded-2xl bg-primary font-bold text-primary-ink">
        わかった
      </button>
    </div>
  );
}

function Coach({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-fg">聞き方</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fg">
        <li>まず雑談。それから入退室、画像、スタンプ。同じ子のズレを見る。</li>
        <li>怪しい子を2人まで絞ってから調査する。質問の種類で、見えるものが変わる。</li>
        <li>同じ質問を別の子に聞くと、答えのズレが比べられる。</li>
        <li>夜にサーバーを抜けた子は、おじさん。本物は投票でキックする。早いほど点が高い。</li>
      </ol>
      <button type="button" data-testid="dismiss-coach" onClick={onClose} className="mt-4 min-h-11 w-full rounded-2xl bg-primary font-bold text-primary-ink">
        配信を見る
      </button>
    </div>
  );
}

function QuestionSheet({ state, onPick }: { state: GameState; onPick: (id: QuestionId) => void }) {
  const persona = state.selected ? personaById(state.selected) : null;
  return (
    <div>
      <h2 className="text-lg font-bold text-fg">{persona?.name}に質問</h2>
      <p className="mt-1 text-sm text-muted">答えは事実。調査を1回使う。</p>
      <div className="mt-3 grid gap-2">
        {QUESTIONS.map((question) => {
          const used = state.probes.some((probe) => probe.kind === "dm" && probe.personaId === state.selected && probe.questionId === question.id);
          return (
            <button
              key={question.id}
              type="button"
              data-testid={`question-${question.id}`}
              disabled={used}
              onClick={() => onPick(question.id)}
              className="min-h-11 rounded-2xl border border-line bg-bg px-3 py-2 text-left disabled:opacity-40"
            >
              <span className="block text-sm font-bold text-fg">{question.label}</span>
              <span className="block text-xs text-muted">{question.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CrossSheet({ state, onPick }: { state: GameState; onPick: (id: string) => void }) {
  const speaker = state.selected ? personaById(state.selected) : null;
  const options = PERSONAS.filter((persona) => persona.id !== state.selected && !state.exiled.includes(persona.id));
  return (
    <div>
      <h2 className="text-lg font-bold text-fg">{speaker?.name}に印象を聞く</h2>
      <p className="mt-1 text-sm text-muted">漏れるのは{speaker?.name}の本音。相手の正体ではない。</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((persona) => {
          const used = state.probes.some((probe) => probe.kind === "cross" && probe.personaId === state.selected && probe.targetId === persona.id);
          return (
            <button
              key={persona.id}
              type="button"
              data-testid={`cross-${persona.id}`}
              disabled={used}
              onClick={() => onPick(persona.id)}
              className="min-h-11 overflow-hidden rounded-2xl border border-line bg-bg text-left disabled:opacity-40"
            >
              <Face src={persona.image} alt="" className="aspect-video w-full object-top" />
              <span className="block px-2 py-2 text-sm font-medium text-fg">{persona.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExileSheet({
  state,
  draft,
  setDraft,
  onSkip,
  onConfirm,
}: {
  state: GameState;
  draft: string | null;
  setDraft: (id: string) => void;
  onSkip: () => void;
  onConfirm: () => void;
}) {
  const alive = PERSONAS.filter((persona) => !state.exiled.includes(persona.id));
  const voters = alive.length + 1;
  const need = Math.floor(voters / 2) + 1;
  const picked = draft ? personaById(draft) : null;
  return (
    <div>
      <h2 className="text-lg font-bold text-fg">キック投票</h2>
      <p className="mt-1 text-sm text-muted">
        参加者{voters}。過半数は{need}票。届いた子を Bot がサーバーからキックする。本物ならクリア。
        {state.day >= 2 ? " 今日が最後。本物をキックできないと失敗。" : " おじさんでも、その子が抜けるだけ。"}
        {state.probesLeft > 0 ? ` 調査が${state.probesLeft}回残っている。` : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {alive.map((persona) => (
          <button
            key={persona.id}
            type="button"
            data-testid={`vote-${persona.id}`}
            onClick={() => setDraft(persona.id)}
            className={cx("overflow-hidden rounded-2xl border text-left", draft === persona.id ? "border-primary" : "border-line")}
          >
            <Face src={persona.image} alt="" className="aspect-video w-full" />
            <span className="block px-2 py-2 text-sm text-fg">{persona.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" data-testid="vote-skip" onClick={onSkip} className="min-h-11 rounded-2xl border border-line bg-bg text-sm font-medium text-fg">
          投票しない
        </button>
        <button type="button" disabled={!draft} onClick={onConfirm} className="min-h-11 rounded-2xl bg-primary text-sm font-bold text-primary-ink disabled:opacity-40">
          {picked ? `${picked.name}に投票` : "子を選んで"}
        </button>
      </div>
    </div>
  );
}
