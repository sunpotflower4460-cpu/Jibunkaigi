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

// ★ 追加：estimateState をインポート
import { estimateState } from './runtime/stateEstimate';

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
  try { return JSON.parse(normalized); } catch {}
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

  // ★ 追加：estimateState を試しに呼び出してログ出力
  useEffect(() => {
    console.log('test1', estimateState('やりたいのに動けない'));
    console.log('test2', estimateState('作品を出したいけど怖い'));
    console.log('test3', estimateState('もう無理で諦めたい'));
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
                responseJsonSchema: reactionSchema ? reactionJsonSchema : undefined
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

    const systemPrompt = `あなたは${agent.name}。${agent.prompt}\n【制約】${MODES[selectedMode].constraint}\n【対話履歴】\n${context}`;

    try {
      const response = await callGemini({
        prompt: `${userName}に言葉を。`,
        systemInstruction: systemPrompt,
        model: GEMINI_CHAT_MODEL
      });

      if (currentSessionIdRef.current !== sessionId) {
        setIsGenerating(false); setGeneratingAgent(null); return;
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
      } else if (msg.includes("Empty response")) {
        setErrorMessage("AIの応答が空でした。");
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
      <div className="water-shimmer z-0" />
      <div className={`flex w-full h-full relative z-10 transition-opacity duration-500 ${isHomeReady || !showIntro ? 'opacity-100' : 'opacity-0'}`}>
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] md:hidden" />}

        {/* 以下、既存のUIコードをそのまま続けてください（サイドバー、ヘッダー、メッセージ表示など） */}
        {/* ここには元の App.jsx の全UIレイアウト（<aside>〜最後の</div>まで）をそのままコピーしてください */}
        
        {/* 省略：元のコードの <aside>〜全UIをここに貼り付けてください */}
        
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-in { animation: fadeIn 300ms ease-out both; }
        .fade-in { animation-name: fadeIn; }
        .slide-in-from-top-2 { animation: slideInFromTop2 300ms ease-out both; }
        .slide-in-from-bottom-2 { animation: slideInFromBottom2 300ms ease-out both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInFromTop2 { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
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
