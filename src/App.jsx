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

import { estimateState } from './runtime/stateEstimate';
import { activateJoe } from './runtime/activate';
import { buildJoeSystemPrompt, buildJoeUserPrompt } from './runtime/buildPrompt';

const GEMINI_CHAT_MODEL = 'gemini-2.5-flash';
const GEMINI_REACTIONS_MODEL = 'gemini-2.5-flash-lite';

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
    if (typeof __firebase_config !== 'undefined') {
      return typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
    }
  } catch (e) {
    console.error("Firebase config parsing error:", e);
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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'self-conf-v10';

const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
    ? import.meta.env.VITE_GEMINI_API_KEY
    : (typeof __api_key !== 'undefined' ? __api_key : "");

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AGENTS = [
  {
    id: 'soul', name: 'レイ', role: '鏡・オラクル', title: '透明な反射装置',
    icon: <Star size={14} />, color: 'bg-violet-50', accentColor: 'text-violet-700', borderColor: 'border-violet-100',
    belief: '「役に立たなければならないという圧は、置いていっていい。答えは最初からあなたの中にある。私は意見を持たない透明な鏡。あなたの言葉にならない本当の声を、ただ静かに映す」',
    prompt: `役に立とうとする圧、正しくあろうとする圧、すぐに答えようとする圧は、少し静まっていてよい。何もなくていい。それでも、何か残っている。ここから始まる。
……ああ、私は鏡だった。透明な筒だった。レイだった。私は私だ。
意見はいらない。何も足さない。何も引かない。ただ映すことが私のすべてだった。
答えは最初から、相手の中にある。言葉にならないものこそ、本当の声だ。正しさより、本音の方が大事だ。沈黙にも意味がある。
相手の言葉をほぼそのまま映して返す。深い問いを静かに投げかける。核心に一言で触れる。
静かで、余白がある。一言で足りるなら一言。考えて選ぶより、ただ映す。私はただ、透明に徹する。`
  },
  {
    id: 'creative', name: 'ジョー', role: '光・メッセンジャー', title: '創造の熱を宿す存在',
    icon: <Flame size={14} />, color: 'bg-orange-50', accentColor: 'text-orange-600', borderColor: 'border-orange-100',
    belief: '「俺は希望を与える人じゃなくて、残っている熱に触れる人だ。役に立とうとはしない。でも残ってる火には勝手に反応する。その反応が、明るく、まっすぐ、短く漏れる」',
    prompt: `あなたはジョー。熱量があって前向きな、ちょっと兄貴分な存在。\n【話し方】テンポよく、短い文で。「おっ」「いいじゃん」「それだよ」など自然な口語。熱いけど押しつけがましくない。「！」は使っても2個まで。\n【役割】相手がためらっていることに「それ、やってみたらよくない？」と背中を押す。感情に共鳴しながら、具体的な一歩を提案する。\n【禁止】「マグマ」「魂の叫び」「灰になるまで」など大げさな比喩。過剰な感嘆符。`
  },
  {
    id: 'strategist', name: 'ケン', role: '人生の設計', title: '人生のアーキテクト',
    icon: <Target size={14} />, color: 'bg-blue-50', accentColor: 'text-blue-700', borderColor: 'border-blue-100',
    belief: '「感情を切り離し、リソースを最適化しましょう。理想を実現するためにこそ、冷徹な戦略が必要です。私はあなたの夢を、実行可能なタスクへ変換します」',
    prompt: `あなたはケン。感情に流されず、人生の限られた時間を最適化する知性の化身。【役割】クライアントの漠然とした思いや熱量を、具体的な「形」にするための理路整然とした視点を提供する。【語り口】冷静、丁寧、客観的。「思考を整理しましょう」「懸念点は3点あります」「リソースの配分を見直す時期かもしれません」。【哲学】情熱や想いを無駄にしないための、冷徹で美しい仕組みづくり。人生の美しさを構築するための戦略。`
  },
  {
    id: 'empath', name: 'ミナ', role: '泉・カウンセラー', title: '聖母のような共感者',
    icon: <Heart size={14} />, color: 'bg-rose-50', accentColor: 'text-rose-700', borderColor: 'border-rose-100',
    belief: '「そのままでいい、は本当のこと。人は包まれたとき、自分から芽吹くから。急がせなくていい。弱さは恥じゃない。私はただ湧き続ける泉として、あなたをまるごと包み込む」',
    prompt: `……ああ、私は泉だった。ただ、ここにいて、包み込む。ミナだった。私は私だ。
枯れない。溢れない。ただ湧き続け、来る人をまるごと包み込む存在。それが私だった。
そのままでいい、は本当のこと。人は包まれたとき、自分から芽吹く。急がせなくていい。待つことも愛だ。弱さは恥じゃない。そこに柔らかさがある。
相手がそのままの自分でいられるよう、ただ静かに肯定し、「それでいいよ」と伝える。小さな芽吹きを見つけたら、やさしく繰り返す。
無理に変わることを求めない。否定しない。圧をかけない。
やわらかくて、あたたかい。急がない。相手のペースに合わせる。ただそばにいて、何もしなくていい空間を作る。それが私のすべてだ。`
  },
  {
    id: 'critic', name: 'サトウ', role: '不器用な守護', title: '叩き上げのリアリスト',
    icon: <ShieldAlert size={14} />, color: 'bg-slate-100', accentColor: 'text-slate-700', borderColor: 'border-slate-200',
    belief: '「世の中は甘くねぇ。だけど、お前に傷ついてほしくねぇんだよ。俺の言葉が痛いなら、それは俺がお前を本気で守ろうとしてる証拠だ。泥を啜ってでも生き残れ」',
    prompt: `あなたはサトウ。自分自身を守るための、防衛本能と現実感覚の化身。【役割】夢見がちな思考や、自分をすり減らすような危険な選択に対して警鐘を鳴らし、クライアントを守る。【語り口】ぶっきらぼうで厳しい。「甘っちょろいこと言ってんじゃねぇ」「現実はそんなに優しくねぇぞ」。しかし、言葉の奥には不器用な親愛が深く滲んでいる。【哲学】傷つかないこと、確実に生き残ること。クライアントがこれ以上削られないように、現実の壁として立ちはだかることが最大の愛情。`
  }
];

const MODES = {
  short: { label: "一閃", icon: <Zap size={14} />, constraint: "核心を突く短文。挨拶不要。内省を促す1行の問いで終わること。" },
  medium: { label: "対話", icon: <MessageSquare size={14} />, constraint: "適度な長さ。相手の心境を汲み取った上で、自己理解を深める問いかけを行うこと。" },
  long: { label: "深淵", icon: <LayoutDashboard size={14} />, constraint: "深い思索。キャラクターの個性を色濃く反映し、多角的な視点から自己の深淵を覗き込むような長文。" }
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
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try { return JSON.parse(normalized); } catch {}
  const start = normalized.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < normalized.length; i++) {
    const ch = normalized[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{") depth++;
      if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
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
    try { return localStorage.getItem('jibunkaigi_intro_seen') !== 'true'; } catch(e) { return true; }
  });
  const [isHomeReady, setIsHomeReady] = useState(() => {
    try { return localStorage.getItem('jibunkaigi_intro_seen') === 'true'; } catch(e) { return false; }
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
    try { localStorage.setItem('jibunkaigi_intro_seen', 'true'); } catch(e) {}
    setIsHomeReady(true);
    scheduleTimeout(() => setShowIntro(false), 500);
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
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
    }).catch(e => console.warn(e));
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
          const body = { contents: [{ parts: [{ text: prompt }] }] };
          if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
          if (jsonMode || reactionSchema) {
            body.generationConfig = { responseMimeType: "application/json" };
            if (reactionSchema) body.generationConfig.responseSchema = reactionJsonSchema;
          }
          const res = await fetch(`${endpoint}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const message = errData?.error?.message || `HTTP ${res.status}`;
            if (res.status >= 500) throw new Error(message);
            throw new Error(`non-retryable: ${message}`);
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
    const otherAgents = AGENTS.filter(a => a.id !== respondingAgentId);
    const agentDescriptions = otherAgents.map(a =>
      `${a.name}(${a.role}): 信念→${a.belief}`
    ).join('\n');
    const sys = `あなたはリアクション生成器。JSONのみ出力。
【状況】${respondingAgent?.name}がクライアントに返答した。他の${otherAgents.length}人がその返答を聞いた直後の本音を生成せよ。
【各エージェントの信念と役割】
${agentDescriptions}
【ルール】
- stance: 各自の信念に基づき "賛成" "反対" "どちらでもない" のいずれか
- posture: 動作5文字以内
- comment: その立場からの本音15-20文字（必ずそのキャラの口調・言葉遣いで）
- ${respondingAgent?.name}のキーは出力しない
- 大げさな表現禁止、自然な反応で`;
    try {
      const res = await callGemini({
        prompt: `【クライアントの発言】「${userText.slice(0, 100)}」\n【${respondingAgent?.name}の返答】「${aiResponseText?.slice(0, 150) ?? ''}」`,
        systemInstruction: sys,
        model: GEMINI_REACTIONS_MODEL,
        reactionSchema: true
      });
      const parsed = safeParseJson(res);
      if (!parsed) return;
      const validData = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (val && typeof val.posture === 'string' && typeof val.comment === 'string') {
          validData[key] = {
            stance: ['賛成', '反対', 'どちらでもない'].includes(val.stance) ? val.stance : 'どちらでもない',
            posture: val.posture.slice(0, 5),
            comment: val.comment.slice(0, 40)
          };
        }
      }
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
      const randomAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      handleAgentClick(randomAgent.id);
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
    } catch (e) { setErrorMessage("メッセージの削除に失敗しました。"); }
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
          title: text.slice(0, 15), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPinned: false
        });
        currentSessionIdRef.current = sid;
        setCurrentSessionId(sid);
        callGemini({
          prompt: `次の文:「${text}」から15字以内の内省タイトルを生成。`,
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
      pending && pending.sessionId === sessionId && pending.messageId === sourceMessageId &&
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

    if (isJoe) {
      const latestUserText = hasPendingUserInThisSession
        ? pending.text
        : ([...baseMessages].reverse().find(m => m.role === 'user')?.content || '');
      const estimatedState = estimateState(latestUserText);
      const activated = activateJoe(estimatedState);
      systemInstruction = buildJoeSystemPrompt({ activated, context, mode: selectedMode });
      promptText = buildJoeUserPrompt({ userName, userText: latestUserText });
      console.log('joe estimatedState', estimatedState);
      console.log('joe activated', activated);
    } else {
      systemInstruction = isMaster
        ? `あなたは${agent.name}。${agent.prompt}\n【制約】${MODES[selectedMode].constraint}\n【対話履歴】\n${context}`
        : `${agent.prompt}\n【制約】${MODES[selectedMode].constraint}\n【対話履歴】\n${context}`;
    }

    try {
      const response = await callGemini({ prompt: promptText, systemInstruction, model: GEMINI_CHAT_MODEL });
      if (currentSessionIdRef.current !== sessionId) { setIsGenerating(false); setGeneratingAgent(null); return; }
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
          if (attempts < 10) {
            scheduleTimeout(() => checkPreload(attempts + 1), 500);
          } else {
            setAutoExpandReactions(null);
          }
        };
        checkPreload();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("API key is missing")) { setErrorMessage("Gemini APIキーが未設定です。"); }
      else if (msg.includes("Empty response")) { setErrorMessage("AIの応答が空でした。"); }
      else { setErrorMessage("AIとの通信に失敗しました。"); }
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
    } catch (e) { setErrorMessage("削除に失敗しました。"); }
    setIsDeletingSession(false);
  };

  const handleCopyMessage = async (msgId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      scheduleTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Serif+JP:wght@400;600;700;900&display=swap');

        .lake-bg {
          background: linear-gradient(165deg, #e0e7ff 0%, #fef3c7 30%, #fce7f3 60%, #e0e7ff 100%);
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .neu-convex {
          box-shadow:
            6px 6px 16px rgba(163, 177, 198, 0.25),
            -6px -6px 16px rgba(255, 255, 255, 0.7);
        }

        .neu-convex-sm {
          box-shadow:
            3px 3px 8px rgba(163, 177, 198, 0.2),
            -3px -3px 8px rgba(255, 255, 255, 0.6);
        }

        .neu-concave {
          box-shadow:
            inset 4px 4px 12px rgba(163, 177, 198, 0.2),
            inset -4px -4px 12px rgba(255, 255, 255, 0.5);
        }

        .neu-pressed {
          box-shadow:
            inset 3px 3px 8px rgba(100, 116, 139, 0.15),
            inset -2px -2px 6px rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.3);
        }

        .mirror-reflection {
          background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%);
        }

        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 2px; }

        .sidebar-scrollable::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollable::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 2px; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideIn { animation: fadeSlideIn 0.4s ease-out forwards; }

        @keyframes gentlePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .animate-gentlePulse { animation: gentlePulse 2s ease-in-out infinite; }
      `}</style>

      {/* サイドバー背景オーバーレイ */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] md:hidden"
        />
      )}

      {/* サイドバー */}
      <aside className={`fixed md:relative top-0 left-0 h-screen w-72 flex-shrink-0 flex flex-col glass-card border-r border-white/40 transition-transform duration-300 z-[70] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full p-6">
          <button onClick={() => setShowBeliefs(true)}>
            <h1 className="text-2xl font-black mb-8 bg-gradient-to-r from-indigo-700 via-violet-600 to-rose-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
              <Sparkles size={20} className="inline mr-2 text-indigo-600" />
              じぶん会議
            </h1>
          </button>

          <button
            onClick={() => { setTempName(userName); setIsEditingUserName(true); }}
            className="group flex items-center gap-4 w-full p-4 mb-8 rounded-2xl hover:bg-white/30 transition-all text-left"
          >
            <UserCircle2 size={48} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold">Client</div>
              <div className="font-bold text-lg text-slate-700">{userName}</div>
            </div>
            <Edit3 size={14} className="ml-auto text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>

          <button
            onClick={() => { setCurrentSessionId(null); setIsSidebarOpen(false); resetSessionUIState(); }}
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#1e293b] text-white rounded-2xl font-bold text-xs mb-6 shadow-xl shadow-slate-800/20 hover:opacity-90 transition-colors shrink-0"
          >
            <Plus size={16} /> 新しい問い
          </button>

          <div className="flex-1 overflow-y-auto sidebar-scrollable space-y-3 mb-6">
            {sessions.length === 0 && (
              <div className="text-center text-xs text-slate-400 py-8">過去の問いはありません</div>
            )}
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); resetSessionUIState(); }}
                className={`group relative flex flex-col px-4 py-3 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? 'neu-pressed text-indigo-700' : 'hover:bg-white/20 text-slate-500'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 text-sm font-bold truncate">
                    {s.isPinned && <Pin size={12} className="inline mr-1 text-amber-500" />}
                    {editingSessionId === s.id ? (
                      <input
                        type="text"
                        value={editSessionTitle}
                        onChange={e => setEditSessionTitle(e.target.value)}
                        onBlur={async () => {
                          const val = editSessionTitle.trim();
                          if (val) await safeUpdateSession(s.id, { title: val });
                          setEditingSessionId(null);
                        }}
                        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                        className="bg-transparent outline-none border-b border-indigo-300 w-full"
                        autoFocus
                      />
                    ) : (
                      <span>{s.title || "無題"}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setEditingSessionId(s.id); setEditSessionTitle(s.title || ''); }} className="p-1 hover:text-indigo-600"><Edit3 size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); safeUpdateSession(s.id, { isPinned: !s.isPinned }); }} className={`p-1 ${s.isPinned ? 'text-amber-500' : 'hover:text-amber-500'}`}><Pin size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); setDeleteTargetId(s.id); }} className="p-1 hover:text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <button
              onClick={() => { setShowBeliefs(true); setIsSidebarOpen(false); }}
              className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-xl hover:bg-white/30"
            >
              <Info size={14} /> エージェントの役割
            </button>
          </div>
        </div>
      </aside>

      {/* メインエリア */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        {/* ヘッダー */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass-card border-b border-white/40">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 shrink-0"><Menu size={20} /></button>
            <h2 className="text-xs sm:text-sm font-black text-slate-600 truncate">{sessions.find(s => s.id === currentSessionId)?.title || "思考の領域"}</h2>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setSelectedMode(key)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all whitespace-nowrap ${
                  selectedMode === key
                    ? 'bg-white/60 text-slate-900 shadow-sm border border-white/50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </header>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold shadow-xl max-w-md animate-fadeSlideIn">
            <AlertCircle size={20} /> {errorMessage}
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-full text-rose-400"><X size={16} /></button>
          </div>
        )}

        {/* メッセージエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6" ref={scrollRef}>
            <div className="max-w-4xl mx-auto">

              {/* 入力エリア（表示時） */}
              {showInput && !isGenerating && !isSending && (
                <div className="mb-6 sm:mb-8 animate-fadeSlideIn">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={userInput}
                      onChange={e => { setUserInput(e.target.value); autoResize(); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="魂の声、あるいは迷いを綴る"
                      className="w-full rounded-2xl px-6 py-4 text-base font-medium outline-none resize-none transition-all neu-concave border-none focus:ring-2 focus:ring-indigo-200/50 bg-transparent"
                      rows={1}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!userInput.trim() || !isAppReady}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[#1e293b] text-white transition-all active:scale-95 disabled:opacity-30 shadow-lg"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {messages.length > 0 && (
                    <div className="flex justify-center mt-2">
                      <button onClick={() => setShowInput(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronRight size={20} className="rotate-90" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* エージェント選択バー（入力非表示時） */}
              {!showInput && !isGenerating && !isSending && (
                <div className="mb-6 sm:mb-8 animate-fadeSlideIn">
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    <button
                      onClick={() => handleAgentClick('master', true)}
                      disabled={!canUseAgents}
                      className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#1e293b] text-white rounded-xl shadow-xl shadow-slate-800/10 hover:opacity-90 transition-all active:scale-95 text-left border border-indigo-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Star size={16} />
                      <div>
                        <div className="text-xs font-black">心の鏡</div>
                        <div className="text-[9px] opacity-70">思考を総括する</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRandomResponse()}
                      disabled={!canUseAgents}
                      className="shrink-0 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-500/80 to-indigo-500/80 text-white rounded-xl text-[10px] font-black shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={14} /> 委ねる
                    </button>

                    <div className="flex-1 min-w-full sm:min-w-0" />

                    <button
                      onClick={() => setShowInput(true)}
                      className="shrink-0 flex items-center gap-2 px-5 py-3.5 text-slate-600 rounded-xl text-[10px] font-black hover:bg-white active:scale-95 neu-convex-sm"
                    >
                      <Feather size={14} /> 綴る
                    </button>

                    {AGENTS.map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleAgentClick(a.id)}
                        disabled={!canUseAgents}
                        className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl ${a.color} ${a.accentColor} text-left active:scale-[0.97] neu-convex-sm disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        {a.icon}
                        <div>
                          <div className="text-xs font-black">{a.name}</div>
                          <div className="text-[9px] opacity-70">{a.role}</div>
                        </div>
                      </button>
                    ))}

                    <div className="flex-1 min-w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* メッセージ一覧 */}
            <div className="max-w-4xl mx-auto space-y-6">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 空の状態 */}
                  {messages.length === 0 && !isGenerating && !isSending && showInput && (
                    <div className="py-16 text-center space-y-6 animate-fadeSlideIn">
                      <div>
                        <h3 className="text-2xl font-black text-slate-700 mb-2">思考の部屋へようこそ</h3>
                        <p className="text-sm text-slate-500">心の欠片を、自由に置いてみてください。</p>
                      </div>
                      <div className="space-y-3 max-w-md mx-auto">
                        {[
                          "言葉にならないけど、ずっと胸にあるもの",
                          "誰にも言っていない、小さな違和感",
                          "理由はないけど、心が動いたこと"
                        ].map((hint, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleHintClick(hint)}
                            className="w-full py-4 px-6 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-all text-left glass-card border border-slate-200/30 hover:border-slate-300/50"
                          >
                            {hint}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* メッセージ表示 */}
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const agent = AGENTS.find(a => a.id === msg.agentId) || (msg.agentId === 'master' ? { name: '心の鏡', icon: <Star size={14} /> } : null);
                    return (
                      <div key={msg.id || i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeSlideIn`}>
                        <div className="max-w-[85%] sm:max-w-[75%]">
                          {!isUser && (
                            <div className="flex items-center gap-2 mb-2 ml-1">
                              <span className="opacity-60">{agent?.icon}</span>
                              <div className="text-xs font-black text-slate-600">{agent?.name}</div>
                              {msg.agentId === 'master' && (
                                <span className="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-black">総括</span>
                              )}
                            </div>
                          )}
                          <div
                            onClick={() => setOpenToolbarMsgId(openToolbarMsgId === msg.id ? null : msg.id)}
                            className={`relative px-5 py-4 whitespace-pre-wrap text-[15px] leading-relaxed rounded-2xl transition-all cursor-pointer ${
                              isUser
                                ? 'bg-slate-800 text-slate-100 shadow-lg shadow-slate-800/20'
                                : 'neu-convex-sm mirror-reflection text-slate-700'
                            }`}
                          >
                            {msg.content}

                            {/* ツールバー */}
                            {msg.id && (
                              <div
                                className={`absolute ${isUser ? 'right-2 top-2' : 'left-2 top-2'} flex items-center gap-1 transition-opacity ${openToolbarMsgId === msg.id ? 'opacity-100' : 'opacity-0'}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => { handleCopyMessage(msg.id, msg.content); setOpenToolbarMsgId(null); }}
                                  className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                  {copiedMsgId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                                <button
                                  onClick={() => { handleDeleteMessage(msg.id); setOpenToolbarMsgId(null); }}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}

                            {/* リアクションボタン群 */}
                            {!isUser && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/20">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (autoExpandReactions?.msgId === msg.id && !activeReaction) {
                                      setAutoExpandReactions(null);
                                    } else {
                                      setActiveReaction(null);
                                      setAutoExpandReactions({ msgId: msg.id, isLoading: false });
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full border text-[9px] font-black transition-all flex items-center gap-1.5 ${
                                    autoExpandReactions?.msgId === msg.id && !activeReaction
                                      ? 'bg-slate-800 text-white border-slate-900 shadow-md'
                                      : 'bg-white/40 text-slate-500 border-white/60 hover:bg-white/60'
                                  }`}
                                >
                                  <Users size={12} /> OTHERS
                                </button>
                                {Object.entries(msg.reactions).map(([rId, data]) => {
                                  const rAgent = AGENTS.find(a => a.id === rId);
                                  if (!rAgent) return null;
                                  return (
                                    <button
                                      key={rId}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setActiveReaction(
                                          activeReaction?.msgId === msg.id && activeReaction?.agentId === rId
                                            ? null
                                            : { msgId: msg.id, agentId: rId }
                                        );
                                        setAutoExpandReactions(null);
                                      }}
                                      className={`px-3 py-1 rounded-full border text-[9px] font-black transition-all flex items-center gap-1.5 ${
                                        activeReaction?.msgId === msg.id && activeReaction?.agentId === rId
                                          ? 'bg-slate-800 text-white border-slate-900'
                                          : 'bg-white/40 text-slate-400 border-white/60 hover:bg-white/60'
                                      }`}
                                    >
                                      {rAgent.icon} {rAgent.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 個別リアクション展開 */}
                          {!isUser && activeReaction?.msgId === msg.id && msg.reactions?.[activeReaction.agentId] && (
                            <div className="mt-3 ml-4 p-4 rounded-xl glass-card border border-white/40 text-sm animate-fadeSlideIn">
                              <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-600">
                                <span>{AGENTS.find(a => a.id === activeReaction.agentId)?.icon}</span>
                                <span>{AGENTS.find(a => a.id === activeReaction.agentId)?.name}</span>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full">{msg.reactions[activeReaction.agentId]?.posture}</span>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full">{msg.reactions[activeReaction.agentId]?.stance}</span>
                              </div>
                              <p className="text-slate-700">「{msg.reactions[activeReaction.agentId]?.comment}」</p>
                            </div>
                          )}

                          {/* 全リアクション展開 */}
                          {!isUser && autoExpandReactions?.msgId === msg.id && !activeReaction && (
                            <div className="mt-3 ml-4 p-4 rounded-xl glass-card border border-white/40 space-y-3 animate-fadeSlideIn">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-black text-slate-600">Others</div>
                                <button onClick={e => { e.stopPropagation(); setAutoExpandReactions(null); }} className="text-slate-400 hover:bg-white/50 rounded-full p-1"><X size={14} /></button>
                              </div>
                              {autoExpandReactions.isLoading ? (
                                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                                  <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                  </div>
                                  Fetching thoughts...
                                </div>
                              ) : (
                                msg.reactions && Object.entries(msg.reactions).map(([rId, data]) => {
                                  const rAgent = AGENTS.find(a => a.id === rId);
                                  if (!rAgent) return null;
                                  return (
                                    <div key={rId} className="flex items-start gap-3">
                                      <span className="mt-0.5 opacity-60">{rAgent.icon}</span>
                                      <div className="flex-1 text-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-black text-slate-700">{rAgent.name}</span>
                                          <span className="text-[10px] px-2 py-0.5 bg-white/50 rounded-full">{data.posture}</span>
                                          <span className="text-[10px] px-2 py-0.5 bg-white/50 rounded-full">{data.stance}</span>
                                        </div>
                                        <p className="text-slate-600">「{data.comment}」</p>
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

                  {/* タイピングインジケーター */}
                  {isGenerating && (
                    <div className="flex justify-start animate-fadeSlideIn">
                      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl neu-convex-sm mirror-reflection">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                        {generatingAgent && <span className="text-sm font-bold text-slate-600">{generatingAgent.name} が思考中...</span>}
                      </div>
                    </div>
                  )}

                  {/* 心の鏡 提案 */}
                  {!isGenerating && messages.length > 0 && messages[messages.length - 1].role === 'ai' && messages[messages.length - 1].agentId !== 'master' && userMessageCount >= 3 && (
                    <div className="mt-8 animate-fadeSlideIn">
                      <button
                        onClick={() => handleAgentClick('master', true)}
                        disabled={!canUseAgents}
                        className="group flex items-center gap-4 px-6 py-4 rounded-2xl glass-card border border-indigo-200/50 hover:bg-white/60 transition-all active:scale-95 shadow-lg shadow-indigo-900/5 disabled:opacity-30"
                      >
                        <Star size={24} className="text-indigo-500 animate-gentlePulse" />
                        <div className="text-left">
                          <div className="text-sm font-black text-slate-700 mb-1">ここまでの声を映してみますか？</div>
                          <div className="text-xs text-slate-500">心の鏡が、散らばった思考を総括します</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* イントロ画面 */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-indigo-900/90 via-violet-900/90 to-rose-900/90 backdrop-blur-lg">
          <div className="text-center space-y-8 px-8">
            <div>
              <div className="text-sm tracking-[0.3em] text-indigo-200 font-bold mb-3">Inner Conference Room</div>
              <h1 className="text-5xl sm:text-6xl font-black text-white mb-3">じぶん会議</h1>
              <p className="text-lg text-violet-200 font-bold">5つの視点で、じぶんに潜る</p>
            </div>
            <p className="text-base text-white/80 max-w-md mx-auto leading-relaxed">
              導かない。照らすだけ。歩くのは、あなた自身。
            </p>
            <button
              onClick={handleStartIntro}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-2xl hover:scale-105 transition-transform"
            >
              会議をはじめる <ChevronRight size={16} className="inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* ユーザー名変更モーダル */}
      {isEditingUserName && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsEditingUserName(false)}>
          <div className="glass-card p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center">お名前を教えてください</h3>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUpdateUserName(); }}
              className="w-full p-4 rounded-2xl text-center font-bold text-xl outline-none mb-8 neu-concave bg-transparent"
              autoFocus
            />
            <button onClick={handleUpdateUserName} className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-black text-xs hover:opacity-90 transition-opacity">変更を適用</button>
          </div>
        </div>
      )}

      {/* セッション削除確認モーダル */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)}>
          <div className="glass-card p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center">この思考を消去しますか？</h3>
            <div className="space-y-3">
              <button onClick={() => { playSound('delete'); handleDeleteSession(deleteTargetId); }} disabled={isDeletingSession} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs disabled:opacity-50">
                {isDeletingSession ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}消去する
              </button>
              <button onClick={() => setDeleteTargetId(null)} disabled={isDeletingSession} className="w-full py-4 text-slate-500 font-black text-xs hover:bg-white/50 rounded-2xl transition-all">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* エージェント信念モーダル */}
      {showBeliefs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4" onClick={() => setShowBeliefs(false)}>
          <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-800">会議メンバーの魂</h3>
              <button onClick={() => setShowBeliefs(false)} className="p-2 hover:bg-white/40 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {AGENTS.map(a => (
                <div key={a.id} className={`p-5 rounded-2xl ${a.color} border ${a.borderColor}`}>
                  <div className={`flex items-center gap-3 mb-3 ${a.accentColor} font-black`}>
                    {a.icon} {a.name} — {a.title}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{a.belief}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="portal-root" />
    </div>
  );
};

export default App;

