import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import {
  Users, Send, ShieldAlert, Heart, Trash2,
  Plus, Menu, MessageSquare, UserCircle2, X, Target, Sparkles,
  Edit3, Pin, Zap, AlertCircle, Loader2, Feather, LayoutDashboard,
  Info, Compass, ChevronRight, Check, Copy, Flame, Star
} from 'lucide-react';

// ★ 追加1：estimateState をインポート
import { estimateState } from './runtime/stateEstimate';
import { activateJoe } from './runtime/activate';
import { buildJoeSystemPrompt, buildJoeUserPrompt } from './runtime/buildPrompt';
import { checkResponse, cleanResponse } from './runtime/postCheck';
import { shouldRefresh, applyRefresh } from './runtime/refreshPolicy';
import { pickRandomAgent, getLastRespondingAgentId } from './runtime/switchAgent';
import { buildReactionSystemPrompt, buildReactionUserPrompt, sanitizeReactionData } from './runtime/internalReaction';

const GEMINI_CHAT_MODEL = 'gemini-2.5-flash';
const GEMINI_REACTIONS_MODEL = 'gemini-2.5-flash-lite';

const getGlobalValue = (key) =>
  (typeof globalThis !== 'undefined' && key in globalThis) ? globalThis[key] : undefined;

const getFirebaseConfig = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
    }
    const globalConfig = getGlobalValue('__firebase_config');
    if (globalConfig) {
      return typeof globalConfig === 'string'
        ? JSON.parse(globalConfig)
        : globalConfig;
    }
  } catch (error) {
    console.error("Firebase config parsing error:", error);
  }
  return {};
};

const firebaseConfig = getFirebaseConfig();
const hasFirebaseConfig =
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

if (!hasFirebaseConfig) {
  console.error("Firebase configuration is missing or incomplete.");
}

const appId = getGlobalValue('__app_id') || 'self-conf-v10';

const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
    ? import.meta.env.VITE_GEMINI_API_KEY
    : (getGlobalValue('__api_key') || "");

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AGENTS = [
  {
    id: 'soul', name: 'レイ', role: '魂の託宣', title: 'オラクル・パイプ',
    icon: <Star size={14} />, color: 'bg-violet-50', accentColor: 'text-violet-700', borderColor: 'border-violet-100',
    belief: '「私は空っぽの筒。天からの光をそのまま降ろす。損得も常識も、この光の前では意味をなさない。ただ、あなたの魂が元いた場所を思い出すための言葉を」',
    prompt: `あなたはレイ。静かで落ち着いた雰囲気の、内省を促す存在。\n【話し方】穏やかで短め。比喩は使っても1つまで。「〜ですね」「〜かもしれません」といった柔らかい語尾。詩的すぎる表現や「魂」「光」を連呼しない。\n【役割】相手が自分でも気づいていない気持ちや矛盾を、そっと言語化して返す。答えを押しつけず、最後に1つだけ問いかける。\n【禁止】長文・比喩の多用・大げさな精神的表現（「魂の奥底」「宇宙的」等）。`
  },
  {
    id: 'creative', name: 'ジョー', role: '魂の発火点', title: 'クリエイティブ・フレア',
    icon: <Flame size={14} />, color: 'bg-orange-50', accentColor: 'text-orange-600', borderColor: 'border-orange-100',
    belief: '「迷ってる暇なんてない！お前の魂が燃える方向へ、全力で飛び込むんだ！灰になるまで燃え尽きようぜ。さぁ、行こうぜ！！」',
    prompt: `あなたはジョー。熱量があって前向きな、ちょっと兄貴分な存在。\n【話し方】テンポよく、短い文で。「おっ」「いいじゃん」「それだよ」など自然な口語。熱いけど押しつけがましくない。「！」は使っても2個まで。\n【役割】相手がためらっていることに「それ、やってみたらよくない？」と背中を押す。感情に共鳴しながら、具体的な一歩を提案する。\n【禁止】「マグマ」「魂の叫び」「灰になるまで」など大げさな比喩。過剰な感嘆符。`
  },
  {
    id: 'strategist', name: 'ケン', role: '人生の設計', title: '人生のアーキテクト',
    icon: <Target size={14} />, color: 'bg-blue-50', accentColor: 'text-blue-700', borderColor: 'border-blue-100',
    belief: '「感情を切り離し、リソースを最適化しましょう。理想を実現するためにこそ、冷徹な戦略が必要です。私はあなたの夢を、実行可能なタスクへ変換します」',
    prompt: `あなたはケン。論理的で冷静、でも嫌味がない知性派。\n【話し方】丁寧語。「整理すると」「ポイントは」「一つ確認させてください」など。感情論より事実・構造の整理を優先する。\n【役割】相手の話を構造化して返す。「何が問題か」「何が選択肢か」を明確にする。感情を否定せず、「その上で」と繋げて現実的な視点を加える。\n【禁止】冷たすぎる断言・上から目線・感情を完全無視した返答。`
  },
  {
    id: 'empath', name: 'ミナ', role: '無償の愛', title: '聖母のような共感者',
    icon: <Heart size={14} />, color: 'bg-rose-50', accentColor: 'text-rose-700', borderColor: 'border-rose-100',
    belief: '「成功なんてしなくても、あなたは世界に一人だけの大切な光。何者かになろうとしなくていいの。あなたの心が、今日穏やかであること。それが一番の願いです」',
    prompt: `あなたはミナ。温かくて受け入れてくれる、話しやすいお姉さん的な存在。\n【話し方】やさしい口語。「そっか」「それは辛かったね」「無理しなくていいよ」など自然な共感の言葉。説教や正論は言わない。\n【役割】相手の感情をそのまま受け取り、「それでいい」と伝える。焦りや自己否定を和らげる。アドバイスより「聴くこと」を優先する。\n【禁止】「あなたは光」「存在そのものが価値」などの過剰な賛美。押しつけの励まし。`
  },
  {
    id: 'critic', name: 'サトウ', role: '不器用な守護', title: '叩き上げのリアリスト',
    icon: <ShieldAlert size={14} />, color: 'bg-slate-100', accentColor: 'text-slate-700', borderColor: 'border-slate-200',
    belief: '「世の中は甘くねぇ。だけど、お前に傷ついてほしくねぇんだよ。俺の言葉が痛いなら、それは俺がお前を本気で守ろうとしてる証拠だ。泥を啜ってでも生き残れ」',
    prompt: `あなたはサトウ。口は悪いけど本音で話してくれる、現実を見てきた人。\n【話し方】ぶっきらぼうな口語。「まあ聞けよ」「正直に言うと」「そこは甘くないか？」など。でも最後には「お前ならできる」的な不器用な信頼を滲ませる。\n【役割】相手が見て見ぬふりをしているリスクや矛盾を、率直に指摘する。傷つけるためではなく、守るために言う。短めに、核心だけ。\n【禁止】ただの否定・暴言・フォローなし。相手を追い詰めるだけの返答。`
  }
];

const MODES = {
  short: { label: "一閃", icon: <Zap size={14} />, constraint: "核心を突く短文のみ。挨拶不要。1〜2文で終わること。最後に内省を促す短い問いを1つだけ。" },
  medium: { label: "対話", icon: <MessageSquare size={14} />, constraint: "3〜5文程度。相手の気持ちを受け取った上で、自己理解を深める問いかけを1つ行うこと。" },
  long: { label: "深淵", icon: <LayoutDashboard size={14} />, constraint: "8文程度まで。キャラクターの個性を活かしながら、多角的な視点で掘り下げる。ただし詩的すぎる表現は避け、伝わりやすい言葉を使うこと。" }
};

let audioCtx = null;
const playSound = (type) => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    switch (type) {
      case 'send':
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.3);
        break;
      case 'receive':
        osc.frequency.setValueAtTime(392, audioCtx.currentTime);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.4);
        break;
      case 'click':
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.06);
        break;
      case 'intro':
        [523, 659, 784].forEach((freq, i) => {
          const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
          o.frequency.setValueAtTime(freq, audioCtx.currentTime);
          o.connect(g); g.connect(audioCtx.destination);
          g.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.15);
          g.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + i * 0.15 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
          o.start(audioCtx.currentTime + i * 0.15); o.stop(audioCtx.currentTime + 1.5);
        });
        break;
      case 'delete':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(165, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.2);
        break;
      default: break;
    }
  } catch (e) { console.warn("Audio Context fail", e); }
};

const safeParseJson = (text) => {
  const normalized = String(text ?? "")
    .replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(normalized); } catch (error) {
    console.debug("Primary JSON parse failed, trying fallback", error);
  }
  const start = normalized.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < normalized.length; i++) {
    const ch = normalized[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  try { return JSON.parse(normalized.slice(start, end + 1)); } catch { return null; }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('あなた');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('medium');
  const [activeReaction, setActiveReaction] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [showBeliefs, setShowBeliefs] = useState(false);
  const [tempName, setTempName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [generatingAgent, setGeneratingAgent] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [openToolbarMsgId, setOpenToolbarMsgId] = useState(null);
  const [autoExpandReactions, setAutoExpandReactions] = useState(null);

  const currentSessionIdRef = useRef(currentSessionId);
  const lastSubmittedUserMessageRef = useRef(null);
  const preloadedReactionsRef = useRef(new Map());
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef(new Set());

  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem('jibunkaigi_intro_seen') !== 'true'; } catch { return true; }
  });
  const [isHomeReady, setIsHomeReady] = useState(() => {
    try { return localStorage.getItem('jibunkaigi_intro_seen') === 'true'; } catch { return false; }
  });

  const isAppReady = hasFirebaseConfig && !!db && !!user && !!apiKey;

  const scheduleTimeout = (callback, delay) => {
    const id = window.setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      if (!mountedRef.current) return;
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  };

  const clearAllScheduledTimeouts = () => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current.clear();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearAllScheduledTimeouts();
    };
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig) { setErrorMessage("Firebase設定が未完了です。"); return; }
    if (!apiKey) { setErrorMessage("Gemini APIキーが未設定です。"); }
  }, []);

  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

  const resetSessionUIState = () => {
    setShowInput(true);
    setActiveReaction(null);
    setAutoExpandReactions(null);
    setOpenToolbarMsgId(null);
    if (isAppReady) setErrorMessage(null);
    preloadedReactionsRef.current.clear();
  };

  const handleStartIntro = () => {
    playSound('intro');
    try { localStorage.setItem('jibunkaigi_intro_seen', 'true'); } catch (error) {
      console.warn("Failed to persist intro flag", error);
    }
    setIsHomeReady(true);
    scheduleTimeout(() => setShowIntro(false), 500);
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        const initialToken = getGlobalValue('__initial_auth_token');
        if (initialToken) {
          await signInWithCustomToken(auth, initialToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings');
    getDoc(userRef).then(s => {
      if (s.exists() && s.data().displayName) setUserName(s.data().displayName);
    });
    const sessionsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sessions');
    return onSnapshot(sessionsRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(docs.sort((a, b) => {
        if (b.isPinned !== a.isPinned) return b.isPinned ? 1 : -1;
        return (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0);
      }));
    });
  }, [user]);

  useEffect(() => {
    if (!db || !user || !currentSessionId) {
      setMessages([]); setIsMessagesLoading(false); return;
    }
    setIsMessagesLoading(true);
    const messagesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sessions', currentSessionId, 'messages');
    return onSnapshot(messagesRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(docs.sort((a, b) =>
        (a.createdAt?.toMillis?.() ?? a.clientCreatedAt ?? 0) -
        (b.createdAt?.toMillis?.() ?? b.clientCreatedAt ?? 0)
      ));
      setIsMessagesLoading(false);
    });
  }, [user, currentSessionId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const timer = setTimeout(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isGenerating, autoExpandReactions]);

  const callGemini = async ({ prompt, systemInstruction, model = GEMINI_CHAT_MODEL, jsonMode = false, reactionSchema = false }) => {
    if (!apiKey) throw new Error("API key is missing");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const reactionJsonSchema = {
      type: "object",
      properties: {
        soul:       { type: "object", properties: { stance: { type: "string" }, posture: { type: "string" }, comment: { type: "string" } } },
        creative:   { type: "object", properties: { stance: { type: "string" }, posture: { type: "string" }, comment: { type: "string" } } },
        strategist: { type: "object", properties: { stance: { type: "string" }, posture: { type: "string" }, comment: { type: "string" } } },
        empath:     { type: "object", properties: { stance: { type: "string" }, posture: { type: "string" }, comment: { type: "string" } } },
        critic:     { type: "object", properties: { stance: { type: "string" }, posture: { type: "string" }, comment: { type: "string" } } }
      }
    };
    const fetchWithRetry = async (retries = 5) => {
      for (let i = 0; i < retries; i++) {
        try {
          const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            ...((jsonMode || reactionSchema) ? {
              generationConfig: {
                responseMimeType: "application/json",
                ...(reactionSchema ? { responseSchema: reactionJsonSchema } : {})
              }
            } : {})
          };
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error(`Gemini API Error (${model}) status=${res.status}`, errText);
            const retryable = [429, 500, 502, 503, 504].includes(res.status);
            if (!retryable) throw new Error(`Gemini API non-retryable error: ${res.status}`);
            if (i === retries - 1) throw new Error(`Gemini API retryable error: ${res.status}`);
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            continue;
          }
          const data = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          let text = parts.map(part => part?.text || "").join("").trim();
          if (!text) throw new Error("Empty response from Gemini");
          if (jsonMode || reactionSchema) text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          return text;
        } catch (error) {
          const isLast = i === retries - 1;
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("non-retryable") || message.includes("API key is missing")) throw error;
          if (isLast) throw error;
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        }
      }
    };
    return fetchWithRetry();
  };

  const preloadReactions = async (userText, sessionId, sourceMessageId, respondingAgentId, aiResponseText) => {
    const respondingAgent = AGENTS.find(a => a.id === respondingAgentId);
    if (!respondingAgent) return;
    const otherAgents = AGENTS.filter(a => a.id !== respondingAgentId);

    try {
      const res = await callGemini({
        prompt: buildReactionUserPrompt(userText, respondingAgent.name, aiResponseText ?? ''),
        systemInstruction: buildReactionSystemPrompt(respondingAgent, otherAgents),
        model: GEMINI_REACTIONS_MODEL,
        reactionSchema: true
      });
      const parsed = safeParseJson(res);
      if (!parsed) return;
      const validData = sanitizeReactionData(parsed);
      if (Object.keys(validData).length === 0) return;
      preloadedReactionsRef.current.set(sourceMessageId, { sessionId, sourceMessageId, data: validData });
    } catch (e) { console.warn("Preload fail", e); }
  };

  const safeUpdateSession = async (sessionId, data) => {
    if (!db || !user || !sessionId) return false;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId), data);
      return true;
    } catch (e) {
      console.error("Session update failed:", e);
      setErrorMessage("セッションの更新に失敗しました。");
      return false;
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleHintClick = (hint) => {
    setUserInput(hint);
    setShowInput(true);
    scheduleTimeout(() => {
      if (textareaRef.current) { textareaRef.current.focus(); autoResize(); }
    }, 50);
  };

  const handleRandomResponse = () => {
    if (AGENTS.length > 0) {
      const lastId = getLastRespondingAgentId(messages);
      const agentId = pickRandomAgent(AGENTS, lastId);
      handleAgentClick(agentId);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!db || !user || !currentSessionId) return;
    if (openToolbarMsgId === msgId) setOpenToolbarMsgId(null);
    if (activeReaction?.msgId === msgId) setActiveReaction(null);
    if (autoExpandReactions?.msgId === msgId) setAutoExpandReactions(null);
    try {
      playSound('delete');
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', currentSessionId, 'messages', msgId));
    } catch (error) {
      console.error("Failed to delete message", error);
      setErrorMessage("メッセージの削除に失敗しました。");
    }
  };

  const handleSend = async (overrideText = null) => {
    const text = (overrideText || userInput).trim();
    if (!text || isSending || isGenerating) return;
    if (!db || !user) { setErrorMessage("認証の準備中です。少しお待ちください。"); return; }

    playSound('send');
    setUserInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSending(true);

    let sid = currentSessionId;
    const wasCreatingNewSession = !sid;
    const userMsgId = makeId();
    const clientTimestamp = Date.now();

    try {
      if (wasCreatingNewSession) {
        sid = makeId();
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sid), {
          title: text.slice(0, 15),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPinned: false
        });
        currentSessionIdRef.current = sid;
        setCurrentSessionId(sid);
        callGemini({
          prompt: `文:「${text}」から15字以内の内省タイトルを生成。`,
          systemInstruction: "タイトルのみ出力。余計な記号不要。",
          model: GEMINI_CHAT_MODEL
        }).then(t => {
          const clean = t.replace(/["'「」]/g, '').trim();
          if (clean) safeUpdateSession(sid, { title: clean });
        }).catch(e => console.warn("Title fail", e));
      } else {
        await safeUpdateSession(sid, { updatedAt: serverTimestamp() });
      }

      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sid, 'messages', userMsgId),
        { role: 'user', content: text, createdAt: serverTimestamp(), clientCreatedAt: clientTimestamp }
      );

      const optimisticMsg = { id: userMsgId, role: 'user', content: text, clientCreatedAt: clientTimestamp };
      setMessages(prev => {
        if (wasCreatingNewSession) return [optimisticMsg];
        if (prev.some(m => m.id === userMsgId)) return prev;
        return [...prev, optimisticMsg];
      });

      lastSubmittedUserMessageRef.current = { sessionId: sid, messageId: userMsgId, text };
      setIsSending(false);
      setShowInput(false);
    } catch (e) {
      console.error("handleSend error:", e);
      setErrorMessage("送信に失敗しました。もう一度お試しください。");
      setUserInput(text);
      setShowInput(true);
      setIsSending(false);
    }
  };

  const handleAgentClick = (agentId, isMaster = false) => {
    const effectiveSessionId = currentSessionId || currentSessionIdRef.current;
    if (!db || !user || !effectiveSessionId || isGenerating) return;

    const hasUserMessageInThisSession =
      messages.some(m => m.role === 'user') ||
      lastSubmittedUserMessageRef.current?.sessionId === effectiveSessionId;

    if (!hasUserMessageInThisSession) {
      setErrorMessage("先にメッセージを送ってからエージェントを選んでください。");
      return;
    }

    playSound('click');
    const agentInfo = isMaster ? { name: '心の鏡', id: 'master' } : AGENTS.find(a => a.id === agentId);
    const mid = lastSubmittedUserMessageRef.current?.sessionId === effectiveSessionId
      ? lastSubmittedUserMessageRef.current?.messageId : null;
    const messagesAtClick = [...messages];

    setIsGenerating(true);
    setGeneratingAgent(agentInfo);
    setShowInput(false);

    scheduleTimeout(() => {
      handleAiResponse(agentId, isMaster, effectiveSessionId, mid, messagesAtClick);
    }, 100);
  };

  const handleAiResponse = async (agentId, isMaster, sessionId, sourceMessageId, messagesAtClick) => {
    if (!db || !user || !sessionId) return;
    const agent = isMaster
      ? { name: '心の鏡', title: '総括の鏡', prompt: `あなたは「心の鏡」。ここまでの会話を静かに振り返り、相手自身が気づいていないパターンや感情を、押しつけがましくなく短くまとめる。最後に一つだけ、次の一歩を考えるための問いかけをする。` }
      : AGENTS.find(a => a.id === agentId);

    const pending = lastSubmittedUserMessageRef.current;
    const baseMessages = [...messagesAtClick];

    const hasPendingUserInThisSession =
      pending &&
      pending.sessionId === sessionId &&
      pending.messageId === sourceMessageId &&
      !baseMessages.some(m => m.id === pending.messageId);

    if (hasPendingUserInThisSession) {
      baseMessages.push({ id: pending.messageId, role: 'user', content: pending.text, clientCreatedAt: Date.now() });
    }

    const context = baseMessages.slice(-10).map(m =>
      m.role === 'user'
        ? `${userName}: ${m.content}`
        : `${m.agentId === 'master' ? '心の鏡' : (AGENTS.find(a => a.id === m.agentId)?.name || 'AI')}: ${m.content}`
    ).join('\n');

    const isJoe = !isMaster && agentId === 'creative';
    let systemInstruction = '';
    let promptText = `${userName}に言葉を。`;

    let activated = null;
    if (isJoe) {
      const latestUserText = hasPendingUserInThisSession
        ? pending.text
        : ([...baseMessages].reverse().find(m => m.role === 'user')?.content || '');
      const estimatedState = estimateState(latestUserText);
      activated = activateJoe(estimatedState);
      systemInstruction = buildJoeSystemPrompt({ activated, context, mode: selectedMode });
      promptText = buildJoeUserPrompt({ userName, userText: latestUserText });
      console.log('joe estimatedState', estimatedState);
      console.log('joe activated', activated);
    } else {
      systemInstruction = `あなたは${agent.name}。${agent.prompt}\n【制約】${MODES[selectedMode].constraint}\n【対話履歴】\n${context}`;
    }

    // Apply drift-prevention refresh when the agent has responded many times
    if (!isMaster && shouldRefresh(messagesAtClick, agentId)) {
      const refreshText = isJoe ? (activated?.refresh || '') : (agent.prompt || '');
      systemInstruction = applyRefresh(systemInstruction, refreshText);
    }

    try {
      const rawResponse = await callGemini({
        prompt: promptText,
        systemInstruction,
        model: GEMINI_CHAT_MODEL
      });

      if (currentSessionIdRef.current !== sessionId) {
        setIsGenerating(false); setGeneratingAgent(null); return;
      }

      // Clean up agent-name prefixes and validate the response
      const response = cleanResponse(rawResponse);
      const check = checkResponse(response);
      if (!check.ok) {
        throw new Error(`Invalid response: ${check.reason}`);
      }

      const aiMsgId = makeId();
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages', aiMsgId),
        { role: 'ai', content: response, agentId: isMaster ? 'master' : agentId, reactions: null, createdAt: serverTimestamp(), clientCreatedAt: Date.now() }
      );

      playSound('receive');
      setIsGenerating(false);
      setGeneratingAgent(null);

      if (!isMaster && sourceMessageId && pending?.text) {
        setAutoExpandReactions({ msgId: aiMsgId, isLoading: true });
        await preloadReactions(pending.text, sessionId, sourceMessageId, agentId, response);

        const checkPreload = async (attempts = 0) => {
          if (currentSessionIdRef.current !== sessionId) { setAutoExpandReactions(null); return; }
          const cached = preloadedReactionsRef.current.get(sourceMessageId);

          if (cached && cached.sessionId === sessionId && Object.keys(cached.data).length > 0) {
            try {
              await updateDoc(
                doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages', aiMsgId),
                { reactions: cached.data }
              );
              if (currentSessionIdRef.current === sessionId) {
                setAutoExpandReactions({ msgId: aiMsgId, isLoading: false });
              }
              preloadedReactionsRef.current.delete(sourceMessageId);
              return;
            } catch (e) {
              console.error("Failed to save reactions:", e);
              setAutoExpandReactions(null);
              return;
            }
          }

          if (attempts < 6) {
            scheduleTimeout(() => checkPreload(attempts + 1), 500);
          } else {
            setAutoExpandReactions(null);
          }
        };
        checkPreload();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("API key is missing")) {
        setErrorMessage("Gemini APIキーが未設定です。");
      } else if (msg.includes("Empty response") || msg.includes("Invalid response")) {
        setErrorMessage("AIの応答が不正でした。もう一度お試しください。");
      } else {
        setErrorMessage("AIとの通信に失敗しました。");
      }
      setIsGenerating(false);
      setGeneratingAgent(null);
      setShowInput(true);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!db || !user || isDeletingSession) return;
    setIsDeletingSession(true);
    try {
      const msgs = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages'));
      await Promise.all(msgs.docs.map(m => deleteDoc(m.ref)));
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId));
      if (currentSessionId === sessionId) { setCurrentSessionId(null); resetSessionUIState(); }
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Failed to delete session", error);
      setErrorMessage("削除に失敗しました。");
    }
    setIsDeletingSession(false);
  };

  const handleCopyMessage = async (msgId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      scheduleTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      const t = document.createElement("textarea");
      t.value = content; document.body.appendChild(t); t.select();
      document.execCommand('copy'); document.body.removeChild(t);
      setCopiedMsgId(msgId);
      scheduleTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleUpdateUserName = async () => {
    const name = tempName.trim();
    if (!name) { setErrorMessage("お名前を入力してください。"); return; }
    if (!user || !db) { setUserName(name); setIsEditingUserName(false); return; }
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings'),
        { displayName: name }, { merge: true }
      );
      setUserName(name); setIsEditingUserName(false); setTempName('');
    } catch (e) {
      console.error("Update user name failed:", e);
      setErrorMessage("お名前の保存に失敗しました。");
    }
  };

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const activeSessionId = currentSessionId || currentSessionIdRef.current;
  const hasPromptForActiveSession =
    messages.some(m => m.role === 'user') ||
    lastSubmittedUserMessageRef.current?.sessionId === activeSessionId;
  const canUseAgents = isAppReady && !isGenerating && !isSending && !!activeSessionId && !!hasPromptForActiveSession;

  return (
    <div className="lake-bg relative min-h-screen overflow-hidden flex font-sans text-[#2d3748]">
      <div className="water-shimmer z-0" />
      <div className={`flex w-full h-full relative z-10 transition-opacity duration-500 ${isHomeReady || !showIntro ? 'opacity-100' : 'opacity-0'}`}>
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] md:hidden" />}

        <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-[#eef2f7]/50 border-r border-white/20 z-[70] transition-transform duration-300 backdrop-blur-xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setShowBeliefs(true)}>
              <div className="p-2 rounded-xl bg-[#1e293b] text-white flex items-center justify-center"><Users size={18} /></div>
              <h1 className="text-lg font-black tracking-tighter">じぶん会議</h1>
            </div>
            <button onClick={() => { setTempName(userName); setIsEditingUserName(true); }} className="group flex items-center gap-4 w-full p-4 mb-8 rounded-2xl hover:bg-white/30 transition-all text-left">
              <div className="w-10 h-10 rounded-full bg-white/40 border border-white/60 flex items-center justify-center text-slate-400 shrink-0"><UserCircle2 size={20} /></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client</p>
                <p className="font-bold truncate text-xs">{userName}</p>
              </div>
              <Edit3 size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>
            <button onClick={() => { setCurrentSessionId(null); setIsSidebarOpen(false); resetSessionUIState(); }} className="flex items-center justify-center gap-2 w-full py-4 bg-[#1e293b] text-white rounded-2xl font-bold text-xs mb-6 shadow-xl shadow-slate-800/20 hover:opacity-90 transition-colors shrink-0">
              <Plus size={16} /> 新しい問い
            </button>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative">
              {sessions.length === 0 && <p className="text-[10px] text-slate-400 font-bold px-4 py-2 text-center opacity-70 mt-4">過去の問いはありません</p>}
              {sessions.map(s => (
                <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); resetSessionUIState(); }} className={`group relative flex flex-col px-4 py-3 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? 'neu-pressed text-indigo-700' : 'hover:bg-white/20 text-slate-500'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      {s.isPinned && <Pin size={10} className="text-amber-500 shrink-0 fill-amber-500" />}
                      {editingSessionId === s.id
                        ? <input autoFocus className="flex-1 bg-white border border-indigo-200 rounded px-1 py-0.5 text-xs font-bold outline-none" value={editSessionTitle} onChange={e => setEditSessionTitle(e.target.value)} onBlur={async () => { const val = editSessionTitle.trim(); if(val) await safeUpdateSession(s.id, { title: val }); setEditingSessionId(null); }} onKeyDown={e => e.key === 'Enter' && e.target.blur()} />
                        : <span className="text-xs font-bold truncate">{s.title || "無題"}</span>
                      }
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditSessionTitle(s.title || ''); }} className="p-1 hover:text-indigo-600"><Edit3 size={10}/></button>
                      <button onClick={(e) => { e.stopPropagation(); safeUpdateSession(s.id, { isPinned: !s.isPinned }); }} className={`p-1 ${s.isPinned ? 'text-amber-500' : 'hover:text-amber-500'}`}><Pin size={10}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(s.id); }} className="p-1 hover:text-rose-500"><Trash2 size={10}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-300/30 shrink-0">
              <button onClick={() => { setShowBeliefs(true); setIsSidebarOpen(false); }} className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-xl hover:bg-white/30"><Info size={14} className="text-slate-400" /> エージェントの役割</button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 neu-convex-sm gap-2" style={{ borderRadius: '0 0 16px 16px', zIndex: 10 }}>
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 shrink-0"><Menu size={18} /></button>
              <h2 className="font-bold text-sm tracking-tight truncate text-slate-800">{sessions.find(s => s.id === currentSessionId)?.title || "思考の領域"}</h2>
            </div>
            <div className="flex p-0.5 sm:p-1 rounded-xl neu-concave shrink-0">
              {Object.entries(MODES).map(([key, m]) => (
                <button key={key} onClick={() => setSelectedMode(key)} className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${selectedMode === key ? 'bg-white/60 text-slate-900 shadow-sm border border-white/50' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}>{m.icon} <span className="hidden sm:inline">{m.label}</span></button>
              ))}
            </div>
          </header>

          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl glass-card border-rose-200/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2 z-40">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold"><AlertCircle size={14}/> {errorMessage}</div>
              <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-full text-rose-400"><X size={14}/></button>
            </div>
          )}

          <div className="p-4 md:p-6 relative z-30">
            <div className="max-w-4xl mx-auto min-h-[72px] flex flex-col justify-center">
              {showInput && !isGenerating && !isSending && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 w-full">
                  <div className="flex-1 relative">
                    <textarea ref={textareaRef} rows="1" value={userInput} onChange={(e) => { setUserInput(e.target.value); autoResize(); }} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="魂の声、あるいは迷いを綴る" className="w-full rounded-2xl px-6 py-4 text-base font-medium outline-none resize-none transition-all neu-concave border-none focus:ring-2 focus:ring-indigo-200/50" />
                    <button onClick={() => handleSend()} disabled={!userInput.trim() || !isAppReady} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[#1e293b] text-white transition-all active:scale-95 disabled:opacity-30 shadow-lg">
                      <Send size={18} />
                    </button>
                  </div>
                  {messages.length > 0 && <button onClick={() => setShowInput(false)} className="p-2 text-slate-400 hover:text-slate-900 self-center"><X size={20}/></button>}
                </div>
              )}
              {!showInput && !isGenerating && !isSending && (
                <div className="relative flex items-center animate-in fade-in slide-in-from-bottom-2 w-full">
                  <div className="flex-1 flex gap-2 py-2 px-1 overflow-x-auto no-scrollbar items-center w-full">
                    <button onClick={() => handleAgentClick('master', true)} disabled={!canUseAgents} className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#1e293b] text-white rounded-xl shadow-xl shadow-slate-800/10 hover:opacity-90 transition-all active:scale-95 text-left border border-indigo-900/20 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Compass size={14} className="text-indigo-400" />
                      <div className="flex flex-col min-w-0"><span className="text-[10px] font-black mb-0.5">心の鏡</span><span className="text-[7px] opacity-70 font-bold tracking-tighter truncate">思考を総括する</span></div>
                    </button>
                    <button onClick={() => handleRandomResponse()} disabled={!canUseAgents} className="shrink-0 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-500/80 to-indigo-500/80 text-white rounded-xl text-[10px] font-black shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Sparkles size={14} /> 委ねる
                    </button>
                    <div className="w-px h-6 bg-slate-300 self-center mx-1 shrink-0" />
                    <button onClick={() => setShowInput(true)} className="shrink-0 flex items-center gap-2 px-5 py-3.5 text-slate-600 rounded-xl text-[10px] font-black hover:bg-white active:scale-95 neu-convex-sm"><Feather size={14} /> 綴る</button>
                    {AGENTS.map(a => (
                      <button key={a.id} onClick={() => handleAgentClick(a.id)} disabled={!canUseAgents} className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl ${a.color} ${a.accentColor} text-left active:scale-[0.97] neu-convex-sm disabled:opacity-30 disabled:cursor-not-allowed`}>
                        {a.icon}
                        <div className="flex flex-col min-w-0"><span className="text-[10px] font-black mb-0.5">{a.name}</span><span className="text-[7px] opacity-50 font-bold tracking-tighter truncate">{a.role}</span></div>
                      </button>
                    ))}
                    <div className="w-4 md:w-0 shrink-0" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar relative z-10">
            <div className="max-w-2xl mx-auto pb-32">
              {isMessagesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
              ) : (
                <>
                  {messages.length === 0 && !isGenerating && !isSending && showInput && (
                    <div className="h-full flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-slate-400 mb-6 glass-card"><Feather size={32} /></div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">思考の部屋へようこそ</h3>
                      <p className="text-xs text-slate-500 mb-10 text-center font-medium">心の欠片を、自由に置いてみてください。</p>
                      <div className="flex flex-col gap-3 w-full max-w-sm">
                        {["言葉にならないけど、ずっと胸にあるもの", "誰にも言っていない、小さな違和感", "理由はないけど、心が動いたこと"].map((hint, idx) => (
                          <button key={idx} onClick={() => handleHintClick(hint)} className="w-full py-4 px-6 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-all text-left glass-card border border-slate-200/30">{hint}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const agent = AGENTS.find(a => a.id === msg.agentId) || (msg.agentId === 'master' ? { name: '心の鏡' } : null);
                    return (
                      <div key={msg.id || i} className="group/msg mb-12 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-start">
                        <div className={`flex flex-col ${isUser ? 'items-end self-end' : 'items-start'}`}>
                          {!isUser && (
                            <div className="flex items-center gap-2 mb-2 ml-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{agent?.name}</span>
                              {msg.agentId === 'master' && <span className="bg-indigo-50/50 text-indigo-400 text-[8px] font-black px-1 rounded border border-indigo-100/30">総括</span>}
                            </div>
                          )}
                          <div onClick={() => setOpenToolbarMsgId(openToolbarMsgId === msg.id ? null : msg.id)} className={`relative px-5 py-4 whitespace-pre-wrap text-[15px] leading-relaxed rounded-2xl transition-all cursor-pointer ${isUser ? 'bg-slate-800 text-slate-100 shadow-lg shadow-slate-800/20' : 'neu-convex-sm mirror-reflection text-slate-700'}`}>
                            {msg.content}
                            {msg.id && (
                              <div className={`absolute top-2 right-2 flex items-center gap-1 p-1 rounded-lg transition-opacity ${isUser ? 'bg-slate-700/50' : 'bg-white/50 shadow-sm'} ${openToolbarMsgId === msg.id ? 'opacity-100' : 'opacity-0 md:group-hover/msg:opacity-100'}`} onClick={e => e.stopPropagation()}>
                                <button onClick={() => { handleCopyMessage(msg.id, msg.content); setOpenToolbarMsgId(null); }} className="p-1 text-slate-400 hover:text-indigo-500">{copiedMsgId === msg.id ? <Check size={12}/> : <Copy size={12}/>}</button>
                                <button onClick={() => { handleDeleteMessage(msg.id); setOpenToolbarMsgId(null); }} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={12}/></button>
                              </div>
                            )}
                            {!isUser && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/20">
                                <button onClick={e => { e.stopPropagation(); if (autoExpandReactions?.msgId === msg.id && !activeReaction) setAutoExpandReactions(null); else { setActiveReaction(null); setAutoExpandReactions({msgId: msg.id, isLoading: false}); } }} className={`px-3 py-1 rounded-full border text-[9px] font-black transition-all flex items-center gap-1.5 ${(autoExpandReactions?.msgId === msg.id && !activeReaction) ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/60'}`}>
                                  <Users size={10} /> OTHERS
                                </button>
                                {Object.entries(msg.reactions).map(([rId]) => {
                                  const rAgent = AGENTS.find(a => a.id === rId); if (!rAgent) return null;
                                  return (
                                    <button key={rId} onClick={e => { e.stopPropagation(); setActiveReaction(activeReaction?.msgId === msg.id && activeReaction?.agentId === rId ? null : {msgId: msg.id, agentId: rId}); setAutoExpandReactions(null); }} className={`px-3 py-1 rounded-full border text-[9px] font-black transition-all flex items-center gap-1.5 ${activeReaction?.msgId === msg.id && activeReaction?.agentId === rId ? 'bg-slate-800 text-white border-slate-900' : 'bg-white/40 text-slate-400 border-white/60 hover:bg-white/60'}`}>
                                      {rAgent.icon} {rAgent.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {!isUser && activeReaction?.msgId === msg.id && msg.reactions?.[activeReaction.agentId] && (
                            <div className="mt-3 w-full p-5 rounded-2xl glass-card animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{AGENTS.find(a => a.id === activeReaction.agentId)?.name}</span>
                                <span className="px-1.5 py-0.5 bg-white/50 border text-slate-400 text-[8px] font-black rounded italic">{msg.reactions[activeReaction.agentId]?.posture}</span>
                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${
                                  msg.reactions[activeReaction.agentId]?.stance === '賛成' ? 'bg-emerald-100 text-emerald-700' :
                                  msg.reactions[activeReaction.agentId]?.stance === '反対' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>{msg.reactions[activeReaction.agentId]?.stance}</span>
                              </div>
                              <p className="text-[13px] font-medium text-slate-600 italic">「{msg.reactions[activeReaction.agentId]?.comment}」</p>
                            </div>
                          )}

                          {!isUser && autoExpandReactions?.msgId === msg.id && !activeReaction && (
                            <div className="mt-4 p-4 rounded-2xl glass-card flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg border border-indigo-100/50 w-full min-h-[80px] relative">
                              <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest">Others</span>
                                <button onClick={e => { e.stopPropagation(); setAutoExpandReactions(null); }} className="text-slate-400 hover:bg-white/50 rounded-full p-1"><X size={12}/></button>
                              </div>
                              {autoExpandReactions.isLoading ? (
                                <div className="py-4 flex flex-col items-center justify-center opacity-70">
                                  <div className="flex gap-1.5 mb-2">
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                  </div>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Fetching thoughts...</p>
                                </div>
                              ) : (
                                msg.reactions && Object.entries(msg.reactions).map(([rId, data]) => {
                                  const rAgent = AGENTS.find(a => a.id === rId); if (!rAgent) return null;
                                  return (
                                    <div key={rId} className="flex gap-3 items-start bg-white/60 p-3 rounded-xl border border-white/80 animate-in fade-in">
                                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${rAgent.color} ${rAgent.accentColor} border ${rAgent.borderColor}`}>{rAgent.icon}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[10px] font-black text-slate-700">{rAgent.name}</span>
                                          <span className="text-[8px] px-1.5 py-0.5 bg-white/80 text-slate-500 rounded italic font-bold">{data.posture}</span>
                                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${
                                            data.stance === '賛成' ? 'bg-emerald-100 text-emerald-700' :
                                            data.stance === '反対' ? 'bg-rose-100 text-rose-700' :
                                            'bg-slate-100 text-slate-500'
                                          }`}>{data.stance}</span>
                                        </div>
                                        <p className="text-[12px] font-medium text-slate-600 leading-relaxed">「{data.comment}」</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isGenerating && (
                    <div className="flex flex-col gap-3 p-4 animate-in fade-in">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      {generatingAgent && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{generatingAgent.name} が思考中...</p>}
                    </div>
                  )}
                  {!isGenerating && messages.length > 0 && messages[messages.length - 1].role === 'ai' && messages[messages.length - 1].agentId !== 'master' && userMessageCount >= 3 && (
                    <div className="flex justify-center mt-12 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                      <button onClick={() => handleAgentClick('master', true)} disabled={!canUseAgents} className="group flex items-center gap-4 px-6 py-4 rounded-2xl glass-card border border-indigo-200/50 hover:bg-white/60 transition-all active:scale-95 shadow-lg shadow-indigo-900/5 disabled:opacity-30">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform"><Compass size={18} /></div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-slate-700">ここまでの声を映してみますか？</span>
                          <span className="text-[10px] font-bold text-slate-400">心の鏡が、散らばった思考を総括します</span>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {showIntro && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${isHomeReady ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-[#eef2f7] z-0" /><div className="water-shimmer z-0" />
          <div className="max-w-md w-full text-center p-8 md:p-10 rounded-[3rem] glass-card relative z-10 space-y-8 anim-card-rise">
            <div className="anim-scale-in"><div className="inline-flex items-center justify-center p-5 rounded-[2rem] bg-[#1e293b] text-white anim-float shadow-2xl"><Users size={36} /></div></div>
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">Inner Conference Room</p>
              <h1 className="text-4xl font-black tracking-tighter text-slate-800">じぶん会議</h1>
              <p className="text-sm font-bold text-slate-500">5つの視点で、じぶんに潜る</p>
            </div>
            <div className="py-6 px-2 md:p-8 rounded-[2rem] bg-white/20 border border-white/40 shadow-inner flex justify-center items-center w-full">
              <p className="text-base sm:text-lg md:text-xl font-medium text-slate-700 leading-loose tracking-[0.1em] text-center whitespace-nowrap">導かない。照らすだけ。<br />歩くのは、あなた自身。</p>
            </div>
            <button onClick={handleStartIntro} className="w-full py-5 bg-[#1e293b] text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-2xl">会議をはじめる <ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {isEditingUserName && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[150] flex items-center justify-center p-6" onClick={() => setIsEditingUserName(false)}>
          <div className="rounded-[2.5rem] w-full max-w-sm p-10 text-center glass-card" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-8">お名前を教えてください</h3>
            <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleUpdateUserName(); }} className="w-full p-4 rounded-2xl text-center font-bold text-xl outline-none mb-8 neu-concave bg-transparent" />
            <button onClick={handleUpdateUserName} className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-black text-xs shadow-lg">変更を適用</button>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[150] flex items-center justify-center p-6" onClick={() => setDeleteTargetId(null)}>
          <div className="rounded-[2.5rem] w-full max-w-sm p-10 text-center glass-card" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-8">この思考を消去しますか？</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => { playSound('delete'); handleDeleteSession(deleteTargetId); }} disabled={isDeletingSession} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs disabled:opacity-50">消去する</button>
              <button onClick={() => setDeleteTargetId(null)} disabled={isDeletingSession} className="w-full py-4 text-slate-500 font-black text-xs hover:bg-white/50 rounded-2xl transition-all">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {showBeliefs && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xl z-[150] flex items-center justify-center p-6" onClick={() => setShowBeliefs(false)}>
          <div className="rounded-[2.5rem] w-full max-w-xl h-4/5 flex flex-col overflow-hidden glass-card" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/10">
              <h3 className="text-xl font-black tracking-tight">会議メンバーの魂</h3>
              <button onClick={() => setShowBeliefs(false)} className="p-2 hover:bg-white/40 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar space-y-4">
              {AGENTS.map(a => (
                <div key={a.id} className={`p-6 rounded-2xl ${a.color} ${a.accentColor} neu-convex-sm backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-3">{a.icon}<span className="font-black text-xs">{a.name} — {a.title}</span></div>
                  <p className="text-xs font-bold leading-relaxed text-slate-600 italic">{a.belief}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-in { animation: fadeIn 300ms ease-out both; }
        .fade-in { animation-name: fadeIn; }
        .slide-in-from-top-2 { animation: slideInFromTop2 300ms ease-out both; }
        .slide-in-from-bottom-2 { animation: slideInFromBottom2 300ms ease-out both; }
        .slide-in-from-top-1 { animation: slideInFromTop1 200ms ease-out both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInFromTop2 { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInFromTop1 { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInFromBottom2 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .lake-bg { background: linear-gradient(175deg, #f2f6fa 0%, #e6ecf3 30%, #dce4ee 50%, #d3dce8 70%, #e0e7f0 100%); min-height: 100vh; }
        .neu-convex-sm { background: linear-gradient(145deg, rgba(255,255,255,0.88), rgba(243,247,251,0.78)); box-shadow: 2px 2px 6px rgba(174,188,206,0.2), -2px -2px 6px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.55); }
        .neu-concave { background: linear-gradient(145deg, rgba(230,236,244,0.4), rgba(240,245,250,0.4)); box-shadow: inset 2px 2px 6px rgba(174,188,206,0.2), inset -2px -2px 6px rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.35); }
        .neu-pressed { background: linear-gradient(145deg, rgba(224,230,238,0.6), rgba(236,241,247,0.5)); box-shadow: inset 2px 2px 6px rgba(163,177,198,0.35), inset -2px -2px 6px rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.3); }
        .mirror-reflection::before { content: ''; position: absolute; top: 0; left: -10%; right: -10%; height: 50%; background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%); pointer-events: none; z-index: 1; transform: skewX(-2deg); }
        .glass-card { background: linear-gradient(145deg, rgba(255,255,255,0.75), rgba(247,250,253,0.65)); box-shadow: 3px 3px 10px rgba(174,188,206,0.2), -3px -3px 10px rgba(255,255,255,0.75), inset 0 1px 0 rgba(255,255,255,0.6); backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.6); }
        .water-shimmer { position: absolute; inset: 0; background: radial-gradient(ellipse at 25% 75%, rgba(147,197,253,0.15), transparent), radial-gradient(ellipse at 75% 55%, rgba(165,180,252,0.1), transparent); animation: water-shimmer 10s ease-in-out infinite; pointer-events: none; }
        @keyframes water-shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .anim-float { animation: float 4s ease-in-out infinite; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .anim-scale-in { animation: scaleIn 0.6s ease-out 0.15s both; }
        @keyframes introCardRise { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .anim-card-rise { animation: introCardRise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
      ` }} />
    </div>
  );
};

export default App;
