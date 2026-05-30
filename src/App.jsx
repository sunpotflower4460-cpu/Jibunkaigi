import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { AlertCircle, X } from 'lucide-react';

// ★ 追加1：estimateState をインポート
import { estimateMicroSignals } from './runtime/estimateMicroSignals.js';
import { summarizeToOthersField } from './runtime/othersField.js';
import { runInternalOS } from './runtime/runInternalOS.js';
import { buildBaselineSystemPrompt, buildBaselineUserPrompt } from './runtime/buildBaselinePrompt';
import { buildOuterGuidePrompt } from './runtime/buildOuterGuidePrompt';
import { buildCompareViewModel } from './runtime/buildCompareViewModel';
import { readCompareModeFlag, shouldShowComparePanel } from './runtime/compareMode';
import { readCompareLabelStore, toggleCompareRevisionLabel, writeCompareLabelStore } from './runtime/compareInsights';
import { getAfterglowSeed } from './runtime/afterglow';
import { buildReactionSystemPrompt, buildReactionUserPrompt, sanitizeReactionData } from './runtime/internalReaction';
import { pickContextualAgent, getLastRespondingAgentId } from './runtime/switchAgent';
import { isSurfaceDebugEnabled, SURFACE_DEBUG_MAX_ENTRIES } from './runtime/surfaceDebug';
import { getOthersVisibilityState } from './runtime/getOthersVisibilityState';
import { getJoeDebugRuntimeFlags, setJoeDebugEnabled, JOE_DEBUG_STORAGE_KEY } from './runtime/joeDebug';
import { isInspectorEnabled, setInspectorEnabled, INSPECTOR_STORAGE_KEY } from './runtime/inspectorDebug';
import { saveTraceToHistory, loadTraceHistory } from './runtime/trace/traceHistoryStore.js';
import { handleAgentResponse as orchestrateAgentResponse } from './runtime/orchestrator/handleAgentResponse.js';
import SurfaceDebugPanel from './components/SurfaceDebugPanel';
import JoeDebugPanel from './components/JoeDebugPanel';
import AgentInspectorPanel from './components/AgentInspectorPanel';
import AgentGateDebugPanel, { isAgentDebugEnabled } from './components/AgentGateDebugPanel';
import CompareModePanel from './components/CompareModePanel';
import FloatingAgentBar from './components/FloatingAgentBar';

// じぶん会議 — premium UI/UX components
import BackgroundLayer from './components/layout/BackgroundLayer';
import TopHeader from './components/layout/TopHeader';
import Sidebar from './components/sidebar/Sidebar';
import Composer from './components/composer/Composer';
import AgentControlBar from './components/composer/AgentControlBar';
import ChatTimeline from './components/chat/ChatTimeline';
import IntroOverlay from './components/dialogs/IntroOverlay';
import UserNameDialog from './components/dialogs/UserNameDialog';
import DeleteSessionDialog from './components/dialogs/DeleteSessionDialog';
import BeliefsDialog from './components/dialogs/BeliefsDialog';

// Definitions, utils, services (Phase 10 externalization)
import { AGENTS } from './agents/agentDefinitions.jsx';
import { MODES } from './modes/responseModes.jsx';
import { makeId } from './utils/id.js';
import { safeParseJson } from './utils/safeParseJson.js';
import { playSound } from './services/sound.js';
import { translate, getLang } from './i18n';
import {
  hasFirebaseConfig,
  firebaseAuth as auth,
  firestoreDb as db,
  appId,
  geminiApiKey as apiKey,
  getInitialAuthToken,
} from './services/firebaseClient.js';

const GEMINI_CHAT_MODEL = 'gemini-2.5-flash';
const GEMINI_REACTIONS_MODEL = 'gemini-2.5-flash-lite';

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
  const [surfaceDebugEntries, setSurfaceDebugEntries] = useState([]);
  const [joeDebugEntry, setJoeDebugEntry] = useState(null);
  const [isJoeDebugPanelVisible, setIsJoeDebugPanelVisible] = useState(() => getJoeDebugRuntimeFlags().joePanelEnabled);
  const [optimisticSessionTitles, setOptimisticSessionTitles] = useState({});
  const [agentDebugEvents, setAgentDebugEvents] = useState([]);
  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(() => readCompareModeFlag());
  const [compareEntries, setCompareEntries] = useState([]);
  const [isCompareCollapsed, setIsCompareCollapsed] = useState(false);
  const [compareLabelStore, setCompareLabelStore] = useState(() => readCompareLabelStore());
  const [isInspectorPanelVisible, setIsInspectorPanelVisible] = useState(() => isInspectorEnabled());
  const [inspectorTraceHistory, setInspectorTraceHistory] = useState(() => loadTraceHistory());
  const errorTimeoutRef = useRef(null);

  const currentSessionIdRef = useRef(currentSessionId);
  // activeSessionIdRef: guards stale async completions from polluting other sessions
  const activeSessionIdRef = useRef(currentSessionId ?? null);
  const lastSubmittedUserMessageRef = useRef(null);
  const preloadedReactionsRef = useRef(new Map());
  const afterglowBySessionRef = useRef(new Map());
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef(new Set());
  const responseTimingRef = useRef(null);
  const compareLabelStoreRef = useRef(compareLabelStore);
  const surfaceDebugEnabled = isSurfaceDebugEnabled();
  const devDebugRuntime = getJoeDebugRuntimeFlags({
    joePanelVisible: isJoeDebugPanelVisible,
    surfacePreviewEnabled: surfaceDebugEnabled,
  });

  // エラーメッセージを設定して自動で消す
  const setErrorWithAutoDismiss = (message, duration = 5000) => {
    setErrorMessage(message);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
      errorTimeoutRef.current = null;
    }, duration);
  };

  // dev-only debug trace helper
  const pushAgentDebugEvent = (event) => {
    if (!isAgentDebugEnabled()) return;
    setAgentDebugEvents((prev) => {
      const next = [...prev, { ...event, at: new Date().toISOString() }];
      return next.slice(-12);
    });
  };

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

  const beginTimedPhase = (traceId, phase) => {
    const label = `[timing][${traceId}] ${phase}`;
    console.time(label);
    return () => console.timeEnd(label);
  };

  const measureFirestoreWrite = async (traceId, detail, operation) => {
    const finish = beginTimedPhase(traceId, `Firestore write ${detail}`);
    try {
      return await operation();
    } finally {
      finish();
    }
  };

  const buildMicroSignalInput = (text) => {
    const latestUserText = typeof text === 'string' ? text : '';
    return {
      latestUserText,
      microSignals: estimateMicroSignals(latestUserText),
    };
  };

  const readSessionAfterglow = (sessionId) => {
    if (!sessionId) return null;
    return afterglowBySessionRef.current.get(sessionId) || null;
  };

  const writeSessionAfterglowLocal = (sessionId, afterglow) => {
    if (!sessionId) return;
    if (afterglow) {
      afterglowBySessionRef.current.set(sessionId, afterglow);
    } else {
      afterglowBySessionRef.current.delete(sessionId);
    }
  };

  const getAfterglowSeedForSession = (sessionId) => getAfterglowSeed(readSessionAfterglow(sessionId));

  const pushSurfaceDebugEntry = (entry) => {
    if (!devDebugRuntime.shouldBuildAgentDebugPreview || !entry) return;
    setSurfaceDebugEntries((prev) => [entry, ...prev].slice(0, SURFACE_DEBUG_MAX_ENTRIES));
  };
  const clearSurfaceDebugEntries = () => setSurfaceDebugEntries([]);
  const handleJoeDebugVisibilityChange = (nextVisible) => {
    if (!devDebugRuntime.available) return;
    setJoeDebugEnabled(nextVisible);
    setIsJoeDebugPanelVisible(nextVisible);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearAllScheduledTimeouts();
    };
  }, []);

  useEffect(() => {
    const updateFlag = () => setIsCompareModeEnabled(readCompareModeFlag());
    updateFlag();

    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === 'jibunkaigi:compareMode') {
        updateFlag();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const joeRuntime = getJoeDebugRuntimeFlags();
    if (!joeRuntime.shouldAttachBrowserControls) return undefined;

    const syncJoeDebug = () => setIsJoeDebugPanelVisible(getJoeDebugRuntimeFlags().joePanelEnabled);
    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === JOE_DEBUG_STORAGE_KEY) {
        syncJoeDebug();
      }
    };
    const handleKeyDown = (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (String(event.key || '').toLowerCase() !== 'j') return;
      event.preventDefault();
      setIsJoeDebugPanelVisible((prev) => {
        const next = !prev;
        setJoeDebugEnabled(next);
        return next;
      });
    };

    syncJoeDebug();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncInspector = () => {
      setIsInspectorPanelVisible(isInspectorEnabled());
    };
    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === INSPECTOR_STORAGE_KEY) {
        syncInspector();
      }
    };
    const handleKeyDown = (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (String(event.key || '').toLowerCase() !== 'i') return;
      event.preventDefault();
      setIsInspectorPanelVisible((prev) => {
        const next = !prev;
        setInspectorEnabled(next);
        return next;
      });
    };

    syncInspector();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    try {
      compareLabelStoreRef.current = compareLabelStore;
      writeCompareLabelStore(compareLabelStore);
    } catch (error) {
      console.warn('[compare-mode] label persistence failed', error);
    }
  }, [compareLabelStore]);

  const getCompareRevisionLabels = (compareKey) => compareLabelStoreRef.current[compareKey] || [];

  const handleToggleCompareLabel = (compareKey, label) => {
    if (!compareKey || !label) return;
    const nextStore = toggleCompareRevisionLabel(compareLabelStore, compareKey, label);
    const nextLabels = nextStore[compareKey] || [];
    setCompareLabelStore(nextStore);
    setCompareEntries((entries) => entries.map((entry) => (
      entry.compareKey === compareKey
        ? {
            ...entry,
            revisionLabels: nextLabels,
            labels: {
              ...(entry.labels || {}),
              selected: nextLabels,
            },
          }
        : entry
    )));
  };

  useEffect(() => {
    if (!hasFirebaseConfig) { setErrorWithAutoDismiss("設定が整うと、ここから会議を始められます。", 10000); return; }
    if (!apiKey) { setErrorWithAutoDismiss("設定が整うと、視点が応答できるようになります。", 10000); }
  }, []);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
    activeSessionIdRef.current = currentSessionId ?? null;
  }, [currentSessionId]);

  const resetSessionUIState = (showInputDefault = true) => {
    setShowInput(showInputDefault);
    setActiveReaction(null);
    setAutoExpandReactions(null);
    setOpenToolbarMsgId(null);
    if (isAppReady) setErrorMessage(null);
    preloadedReactionsRef.current.clear();
    // 追加: loading/generating系を確実にクリア
    setIsGenerating(false);
    setGeneratingAgent(null);
    setIsSending(false);
    setIsMessagesLoading(false);
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
        const initialToken = getInitialAuthToken();
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
    }).catch(e => {
      console.warn('[profile] Failed to load display name', e);
    });
    const sessionsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sessions');
    return onSnapshot(
      sessionsRef,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = docs.sort((a, b) => {
          if (b.isPinned !== a.isPinned) return b.isPinned ? 1 : -1;
          return (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0);
        });
        setSessions(sorted);

        // 正式 title が来た session の optimistic title を削除
        setOptimisticSessionTitles(prev => {
          const updated = { ...prev };
          let changed = false;
          for (const d of sorted) {
            if (d.title && d.id in updated) { delete updated[d.id]; changed = true; }
          }
          return changed ? updated : prev;
        });

        const nextAfterglow = new Map();
        const existing = afterglowBySessionRef.current;

        for (const doc of sorted) {
          if (doc.afterglow) {
            nextAfterglow.set(doc.id, doc.afterglow);
          } else if (existing.has(doc.id)) {
            nextAfterglow.set(doc.id, existing.get(doc.id));
          }
        }

        afterglowBySessionRef.current = nextAfterglow;
      },
      (error) => {
        console.error("Sessions snapshot failed:", error);
        setErrorWithAutoDismiss("セッション一覧をうまく読み込めませんでした。少し時間を置いてお試しください。");
      }
    );
  }, [user]);

  useEffect(() => {
    if (!db || !user || !currentSessionId) {
      setMessages([]); setIsMessagesLoading(false); return;
    }
    const capturedSessionId = currentSessionId;
    // 新規 session 直後は optimistic メッセージを守るためクリアを skip
    const hasPendingOptimistic =
      lastSubmittedUserMessageRef.current?.sessionId === capturedSessionId;
    if (!hasPendingOptimistic) {
      setMessages([]);
      setIsMessagesLoading(true);
    }
    const messagesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sessions', currentSessionId, 'messages');
    return onSnapshot(
      messagesRef,
      (snapshot) => {
        // セッションが切り替わっていた場合は状態更新をスキップ
        if (activeSessionIdRef.current !== capturedSessionId) return;
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(docs.sort((a, b) =>
          (a.createdAt?.toMillis?.() ?? a.clientCreatedAt ?? 0) -
          (b.createdAt?.toMillis?.() ?? b.clientCreatedAt ?? 0)
        ));
        setIsMessagesLoading(false);
      },
      (error) => {
        if (activeSessionIdRef.current !== capturedSessionId) return;
        console.error("Messages snapshot failed:", error);
        setErrorWithAutoDismiss("メッセージをうまく読み込めませんでした。少し時間を置いてお試しください。");
        setIsMessagesLoading(false);
      }
    );
  }, [user, currentSessionId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const timer = setTimeout(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isGenerating, autoExpandReactions]);

  useEffect(() => {
    const trace = responseTimingRef.current;
    if (!trace?.awaitingThinkingRender || !isGenerating) return;

    trace.awaitingThinkingRender = false;
    window.requestAnimationFrame(() => {
      const activeTrace = responseTimingRef.current;
      if (!activeTrace || activeTrace.traceId !== trace.traceId) return;
      console.info(
        `[timing][${trace.traceId}] UI render complete (thinking): ${(performance.now() - trace.clickStartedAt).toFixed(1)}ms`,
      );
    });
  }, [isGenerating, generatingAgent]);

  useEffect(() => {
    const trace = responseTimingRef.current;
    if (!trace?.awaitingResponseRender || !trace.aiMessageId || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.id !== trace.aiMessageId) return;

    trace.awaitingResponseRender = false;
    window.requestAnimationFrame(() => {
      const activeTrace = responseTimingRef.current;
      if (!activeTrace || activeTrace.traceId !== trace.traceId) return;
      console.info(
        `[timing][${trace.traceId}] UI render complete (response): ${(performance.now() - trace.clickStartedAt).toFixed(1)}ms`,
      );
    });
  }, [messages]);

  const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  };

  const callGemini = async ({ prompt, systemInstruction, model = GEMINI_CHAT_MODEL, jsonMode = false, reactionSchema = false }) => {
    if (!apiKey) throw new Error("API key is missing");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const TIMEOUT_MS = 25000;
    // 出力言語のミラーリング：ユーザーの最新メッセージの言語に合わせて応答する。
    // 人格・トーン・制約は言語に関わらず保つ。リアクション生成(JSONスキーマ)は
    // stance トークンを日本語で固定する必要があるため対象外にする。
    const LANGUAGE_DIRECTIVE = [
      '【Output language】',
      "Write your entire response in the same language as the user's most recent message.",
      'If the user writes in English, respond fully in natural English; if in Japanese, respond in Japanese.',
      'Keep your persona, tone, intent, and all constraints identical regardless of language.',
      'Do not translate, do not mix languages, and do not mention this instruction.',
    ].join('\n');
    const effectiveSystemInstruction = reactionSchema
      ? systemInstruction
      : `${systemInstruction}\n\n${LANGUAGE_DIRECTIVE}`;
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
            systemInstruction: { parts: [{ text: effectiveSystemInstruction }] },
            ...((jsonMode || reactionSchema) ? {
              generationConfig: {
                responseMimeType: "application/json",
                ...(reactionSchema ? { responseSchema: reactionJsonSchema } : {})
              }
            } : {})
          };
          console.info(`[callGemini] Attempt ${i + 1}/${retries} for model ${model}`);
          const res = await fetchWithTimeout(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(payload)
          }, TIMEOUT_MS);
          if (!res.ok) {
            const errText = await res.text();
            console.error(`Gemini API Error (${model}) status=${res.status}`, errText);
            const retryable = [429, 500, 502, 503, 504].includes(res.status);
            if (!retryable) throw new Error(`Gemini API non-retryable error: ${res.status}`);
            if (i === retries - 1) throw new Error(`Gemini API retryable error: ${res.status}`);
            console.warn(`[callGemini] Retrying after error (attempt ${i + 1}/${retries})`);
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
          if (message.includes("timeout")) {
            console.error(`[callGemini] Timeout on attempt ${i + 1}/${retries}`);
            if (isLast) throw new Error(`Gemini API timeout after ${retries} attempts`);
          } else if (message.includes("non-retryable") || message.includes("API key is missing")) {
            throw error;
          } else if (isLast) {
            throw error;
          }
          if (!isLast) {
            console.warn(`[callGemini] Retrying after error (attempt ${i + 1}/${retries}): ${message}`);
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
          }
        }
      }
    };
    return fetchWithRetry();
  };

  const preloadReactions = async (userText, sessionId, sourceMessageId, respondingAgentId, aiResponseText) => {
    const respondingAgent = AGENTS.find(a => a.id === respondingAgentId);
    if (!respondingAgent) return;
    const otherAgents = AGENTS.filter(a => a.id !== respondingAgentId);

    const sys = buildReactionSystemPrompt(respondingAgent, otherAgents);
    const prompt = buildReactionUserPrompt(userText, respondingAgent.name, aiResponseText);

    try {
      const res = await callGemini({
        prompt,
        systemInstruction: sys,
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

  const runCompareModeCapture = async ({
    agentId,
    userText,
    currentReply,
    context,
    sessionId,
    messageId,
    usedInternalOS,
    internalOS,
  }) => {
    if (!isCompareModeEnabled) return;
    // Phase P-3: 全エージェント対応（creative, soul, strategist, empath, critic）
    if (!currentReply) return;
    const compareKey = `${sessionId}:${messageId || 'compare'}`;

    const baselineSystem = buildBaselineSystemPrompt(agentId, { userText, mode: selectedMode, context });
    const baselineUser = buildBaselineUserPrompt(agentId, { userName, userText });
    if (!baselineSystem || !baselineUser) return;

    try {
      const revisionLabels = getCompareRevisionLabels(compareKey)
      const baselineReply = await callGemini({
        prompt: baselineUser,
        systemInstruction: baselineSystem,
        model: GEMINI_CHAT_MODEL,
      });

      const outerPrompts = buildOuterGuidePrompt({
        agentId,
        userText,
        baselineReply,
        currentReply,
        mode: selectedMode,
      });

      const outerGuide = await callGemini({
        prompt: outerPrompts.userPrompt,
        systemInstruction: outerPrompts.systemInstruction,
        model: GEMINI_CHAT_MODEL,
      });

      if (activeSessionIdRef.current !== sessionId) return;

      const makerSeedPreview = internalOS?.latentState?.makerSeed ?? null;
      const homeLayerPreview = internalOS?.latentState?.home ?? null;
      const existenceLayerPreview = internalOS?.latentState?.existence ?? null;
      const beliefLayerPreview = internalOS?.latentState?.belief ?? null;
      const activatedThoughtsPreview = internalOS?.latentState?.activatedThoughts ?? null;
      const activatedFeelingsPreview = internalOS?.latentState?.activatedFeelings ?? null;
      const activatedMovesPreview = internalOS?.latentState?.activatedMoves ?? null;
      const preconditionFilterPreview = internalOS?.debugInfo?.preconditionFilterPreview ?? null;
      const preconditionBiasPreview = internalOS?.debugInfo?.preconditionBiasPreview ?? null;
      const feltSensePreview = internalOS?.debugInfo?.feltSensePreview ?? null;
      const speakIntentPreview = internalOS?.debugInfo?.speakIntentPreview ?? null;
      const restraintPreview = internalOS?.debugInfo?.restraintPreview ?? null;
      const decisionMetaPreview = internalOS?.debugInfo?.decisionMetaPreview ?? null;
      const layerBoundaryPreview = internalOS?.debugInfo
        ? {
            latentSubstrateBuilt: internalOS.debugInfo.latentSubstrateBuilt,
            preconditionFilterBuilt: internalOS.debugInfo.preconditionFilterBuilt,
            preconditionBiasBuilt: internalOS.debugInfo.preconditionBiasBuilt,
            dynamicFieldBuiltAfterLatent: internalOS.debugInfo.dynamicFieldBuiltAfterLatent,
            dynamicReactionBuiltAfterLatent: internalOS.debugInfo.dynamicReactionBuiltAfterLatent,
            dynamicStanceBuiltAfterLatent: internalOS.debugInfo.dynamicStanceBuiltAfterLatent,
            status: internalOS.debugInfo.layerBoundaryStatus ?? null,
          }
        : null;

      const vm = buildCompareViewModel({
        agentId,
        userText,
        baselineReply,
        currentReply,
        outerGuide,
        currentUsesInternalOS: usedInternalOS,
        mode: selectedMode,
        revisionLabels,
        makerSeedPreview,
        homeLayerPreview,
        existenceLayerPreview,
        beliefLayerPreview,
        activatedThoughtsPreview,
        activatedFeelingsPreview,
        activatedMovesPreview,
        preconditionFilterPreview,
        preconditionBiasPreview,
        feltSensePreview,
        speakIntentPreview,
        restraintPreview,
        decisionMetaPreview,
        layerBoundaryPreview,
        focusBiasApplied: internalOS?.debugInfo?.focusBiasApplied ?? false,
        meaningBiasApplied: internalOS?.debugInfo?.meaningBiasApplied ?? false,
        identityBiasApplied: internalOS?.debugInfo?.identityBiasApplied ?? null,
      });

      if (!mountedRef.current) return;
      setCompareEntries(prev => [...prev.slice(-2), { ...vm, sessionId, messageId, compareKey, revisionLabels }]);
    } catch (error) {
      console.warn("[compare-mode] generation failed", error);
      if (activeSessionIdRef.current !== sessionId) return;
      if (!mountedRef.current) return;
      const revisionLabels = getCompareRevisionLabels(compareKey)
      const fallback = buildCompareViewModel({
        agentId,
        userText,
        baselineReply: '',
        currentReply,
        outerGuide: '比較の生成に失敗しました。',
        currentUsesInternalOS: usedInternalOS,
        mode: selectedMode,
        revisionLabels,
      });
      setCompareEntries(prev => [...prev.slice(-2), { ...fallback, sessionId, messageId, compareKey, revisionLabels }]);
    }
  };

  const safeUpdateSession = async (sessionId, data) => {
    if (!db || !user || !sessionId) return false;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId), data);
      return true;
    } catch (e) {
      console.error("Session update failed:", e);
      setErrorWithAutoDismiss("セッションの更新がうまくいきませんでした。");
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
    // autoResize と focus を確実に実行
    window.requestAnimationFrame(() => {
      if (textareaRef.current) {
        autoResize();
        textareaRef.current.focus();
      }
    });
  };

  const getLatestUserText = (sessionId, baseMessages = messages) => {
    const pending = lastSubmittedUserMessageRef.current;

    if (pending?.sessionId === sessionId && typeof pending.text === 'string') {
      return pending.text;
    }

    return [...baseMessages].reverse().find((message) => message.role === 'user')?.content || '';
  };

  const handleRandomResponse = () => {
    const effectiveSessionId = currentSessionId || currentSessionIdRef.current;
    if (AGENTS.length === 0 || !effectiveSessionId) {
      console.warn("[handleRandomResponse] Blocked: no agents or no session", { AGENTS: AGENTS.length, effectiveSessionId });
      pushAgentDebugEvent({ tag: 'handleRandomResponse:blocked', reason: 'no-agents-or-session', agentCount: AGENTS.length, sessionId: effectiveSessionId });
      return;
    }

    try {
      const lastAgentId = getLastRespondingAgentId(messages);
      const afterglowSeed = getAfterglowSeedForSession(effectiveSessionId);

      // Normalize afterglowSeed before passing to runInternalOS
      const safePreviousMix =
        afterglowSeed?.previousMix && typeof afterglowSeed.previousMix === 'object'
          ? afterglowSeed.previousMix
          : null;

      const safePreviousLatentState =
        afterglowSeed?.previousLatentState && typeof afterglowSeed.previousLatentState === 'object'
          ? afterglowSeed.previousLatentState
          : null;

      // Build minimal othersField from recent messages
      // messages state は常に現在のアクティブセッションのメッセージのみを含む
      // （Firestore snapshot のメッセージには sessionId フィールドがないため、
      //   フィルタリングは不要）
      const othersFieldEntries = [];
      const seenAgents = new Set();
      for (let i = messages.length - 1; i >= 0 && othersFieldEntries.length < 3; i -= 1) {
        const msg = messages[i];
        if (msg?.role !== 'ai' || !msg.agentId || !msg.content) continue;
        if (seenAgents.has(msg.agentId)) continue;
        const entry = summarizeToOthersField(msg.agentId, msg.content);
        if (entry) {
          othersFieldEntries.push(entry);
          seenAgents.add(msg.agentId);
        }
      }

      const { latestUserText, microSignals } = buildMicroSignalInput(getLatestUserText(effectiveSessionId, messages));
      const internalOS = runInternalOS(latestUserText, {
        mode: selectedMode,
        previousMix: safePreviousMix,
        previousLatentState: safePreviousLatentState,
        othersField: othersFieldEntries,
        lengthPreference: selectedMode,
        microSignals,
      });
      const agentId = pickContextualAgent(AGENTS, {
        patternMix: internalOS.patternMix,
        lastAgentId,
      });

      handleAgentClick(agentId);
    } catch (error) {
      console.error("[handleRandomResponse:error]", error);
      setIsGenerating(false);
      setGeneratingAgent(null);
      setShowInput(true);
      setErrorWithAutoDismiss("「委ねる」がうまく動きませんでした。もう一度お試しください。");
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
      setErrorWithAutoDismiss("メッセージをうまく消せませんでした。");
    }
  };

  const handleSend = async (overrideText = null) => {
    const text = (overrideText || userInput).trim();
    if (!text || isSending || isGenerating) return;
    if (!db || !user) { setErrorWithAutoDismiss("接続を準備しています。少しだけお待ちください。"); return; }

    playSound('send');
    setUserInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSending(true);

    let sid = currentSessionId;
    const wasCreatingNewSession = !sid;
    const userMsgId = makeId();
    const clientTimestamp = Date.now();
    console.info("[send:start]", { text: text.slice(0, 30), wasCreatingNewSession });
    pushAgentDebugEvent({ tag: 'send:start', wasCreatingNewSession, textLength: text.length });

    try {
      if (wasCreatingNewSession) {
        sid = makeId();
        const fallbackTitle = text.slice(0, 15);
        // optimistic title を設定
        setOptimisticSessionTitles(prev => ({ ...prev, [sid]: fallbackTitle }));
        console.info("[send:optimistic-title-set]", { sid, fallbackTitle });
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sid), {
          title: fallbackTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPinned: false
        });
        // セッションIDを先に state にセット（refは useEffect で自動同期）
        setCurrentSessionId(sid);
        console.info("[send:new-session-created]", { sid });
        pushAgentDebugEvent({ tag: 'send:new-session-created', sessionId: sid });
        // ref も即座に更新して同期を保証
        currentSessionIdRef.current = sid;
        activeSessionIdRef.current = sid;
        callGemini({
          prompt: `文:「${text}」から15字以内の内省タイトルを生成。`,
          systemInstruction: "タイトルのみ出力。余計な記号不要。",
          model: GEMINI_CHAT_MODEL
        }).then(t => {
          const clean = t.replace(/["'「」]/g, '').trim();
          if (clean) {
            safeUpdateSession(sid, { title: clean });
          }
          // タイトル生成完了後はoptimistic削除（snapshot経由で正式タイトル取得）
          setOptimisticSessionTitles(prev => {
            const next = { ...prev };
            delete next[sid];
            return next;
          });
        }).catch(e => {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("timeout")) {
            console.warn("[Title generation] Timed out, keeping fallback title");
          } else {
            console.warn("[Title generation] Failed:", msg);
          }
          // エラー時もoptimistic削除して fallback title で固定
          setOptimisticSessionTitles(prev => {
            const next = { ...prev };
            delete next[sid];
            return next;
          });
        });
      } else {
        await safeUpdateSession(sid, { updatedAt: serverTimestamp() });
      }

      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sid, 'messages', userMsgId),
        { role: 'user', content: text, createdAt: serverTimestamp(), clientCreatedAt: clientTimestamp }
      );

      // lastSubmittedUserMessageRef を先に設定してから optimistic メッセージを追加
      lastSubmittedUserMessageRef.current = { sessionId: sid, messageId: userMsgId, text };

      const optimisticMsg = { id: userMsgId, role: 'user', content: text, clientCreatedAt: clientTimestamp };
      setMessages(prev => {
        if (wasCreatingNewSession) return [optimisticMsg];
        if (prev.some(m => m.id === userMsgId)) return prev;
        return [...prev, optimisticMsg];
      });
      console.info("[send:optimistic-message-set]", { sid, userMsgId });
      setShowInput(false);
    } catch (e) {
      console.error("[send:error]", e);
      pushAgentDebugEvent({ tag: 'send:error', error: e instanceof Error ? e.message : String(e) });
      setErrorWithAutoDismiss("うまく送信できませんでした。少し時間を置いて、もう一度お試しください。");
      setUserInput(text);
      setShowInput(true);
    } finally {
      console.info("[send:finally]", { sid });
      // 確実に送信中状態を解除（無条件）
      setIsSending(false);
    }
  };

  const handleAgentClick = (agentId, isMaster = false) => {
    const effectiveSessionId = currentSessionId || currentSessionIdRef.current;
    const debugState = {
      agentId,
      currentSessionId: effectiveSessionId,
      isAppReady,
      isGenerating,
      isSending,
      showInput,
      hasPromptForActiveSession,
      canUseAgents,
      showDelegateBar,
    };

    console.info("[agent-click:start]", debugState);
    pushAgentDebugEvent({ tag: 'agent-click:start', agentId, sessionId: effectiveSessionId });

    if (!isAppReady) {
      console.warn("[agent-click:blocked]", { reason: 'app-not-ready', ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:blocked', reason: 'app-not-ready', agentId, sessionId: effectiveSessionId });
      return;
    }
    if (isGenerating) {
      console.warn("[agent-click:blocked]", { reason: 'busy:isGenerating', ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:blocked', reason: 'busy:isGenerating', agentId, sessionId: effectiveSessionId });
      return;
    }
    if (isSending) {
      console.warn("[agent-click:blocked]", { reason: 'busy:isSending', ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:blocked', reason: 'busy:isSending', agentId, sessionId: effectiveSessionId });
      return;
    }
    if (!effectiveSessionId) {
      console.warn("[agent-click:blocked]", { reason: 'no-session', ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:blocked', reason: 'no-session', agentId });
      return;
    }

    const hasUserMessageInThisSession =
      messages.some(m => m.role === 'user') ||
      lastSubmittedUserMessageRef.current?.sessionId === effectiveSessionId;

    if (!hasUserMessageInThisSession) {
      console.warn("[agent-click:blocked]", { reason: 'no-prompt', ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:blocked', reason: 'no-prompt', agentId, sessionId: effectiveSessionId, messagesCount: messages.length, visibleMessagesCount: messages.filter(m => m.role === 'user' || m.role === 'assistant').length });
      setErrorWithAutoDismiss("まずは「綴る」から、ひとこと置いてみてください。");
      return;
    }

    try {
      playSound('click');
      const agentInfo = isMaster ? { name: '心の鏡', id: 'master' } : AGENTS.find(a => a.id === agentId);
      const mid = lastSubmittedUserMessageRef.current?.sessionId === effectiveSessionId
        ? lastSubmittedUserMessageRef.current?.messageId : null;
      const messagesAtClick = [...messages];
      const traceId = `${effectiveSessionId}:${mid || makeId()}:${isMaster ? 'master' : agentId}`;

      console.info(`[timing][${traceId}] agent button click`);
      console.info("[agent-click:dispatch]", { traceId, ...debugState });
      pushAgentDebugEvent({ tag: 'agent-click:dispatch', agentId, sessionId: effectiveSessionId, traceId });
      responseTimingRef.current = {
        traceId,
        clickStartedAt: performance.now(),
        awaitingThinkingRender: true,
        awaitingResponseRender: false,
        aiMessageId: null,
      };

      setIsGenerating(true);
      setGeneratingAgent(agentInfo);
      setShowInput(false);

      window.requestAnimationFrame(() => {
        Promise.resolve(handleAiResponse(agentId, isMaster, effectiveSessionId, mid, messagesAtClick, traceId)).catch((rafError) => {
          console.error("[raf:handleAiResponse:error]", rafError);
          pushAgentDebugEvent({ tag: 'raf:handleAiResponse:error', reason: rafError?.message || 'unknown', agentId, sessionId: effectiveSessionId });
          setIsGenerating(false);
          setGeneratingAgent(null);
          setShowInput(true);
          setErrorWithAutoDismiss("応答をうまく始められませんでした。もう一度お試しください。");
        });
      });
    } catch (error) {
      console.error("[agent-click:error]", error);
      pushAgentDebugEvent({ tag: 'agent-click:error', error: error instanceof Error ? error.message : String(error), agentId, sessionId: effectiveSessionId });
      setIsGenerating(false);
      setGeneratingAgent(null);
      setShowInput(true);
      setErrorWithAutoDismiss("視点をうまく呼び出せませんでした。もう一度お試しください。");
    } finally {
      console.info("[agent-click:finally]", { agentId, effectiveSessionId });
    }
  };
  const handleAiResponse = async (agentId, isMaster, sessionId, sourceMessageId, messagesAtClick, traceId) => {
    // Agent definition
    const agent = isMaster
      ? { name: '心の鏡', title: '総括の鏡', prompt: `あなたは「心の鏡」。ここまでの会話を静かに振り返り、相手自身が気づいていないパターンや感情を、押しつけがましくなく短くまとめる。最後に一つだけ、次の一歩を考えるための問いかけをする。` }
      : AGENTS.find(a => a.id === agentId);

    try {
      const result = await orchestrateAgentResponse({
        // 基本情報
        agentId,
        isMaster,
        sessionId,
        sourceMessageId,
        messagesAtClick,
        traceId,

        // エージェント定義
        agent,
        AGENTS,

        // ユーザー情報
        userName,

        // DB/Firebase
        db,
        user,
        appId,

        // 設定・モード
        selectedMode,
        othersFieldMode: isCompareModeEnabled ? 'off' : 'thin',

        // セッション状態
        activeSessionIdRef,
        lastSubmittedUserMessageRef,

        // コールバック・ヘルパー
        callGemini,
        makeId,
        pushAgentDebugEvent,
        pushSurfaceDebugEntry,
        setJoeDebugEntry,
        devDebugRuntime,
        readSessionAfterglow,
        writeSessionAfterglowLocal,
        safeUpdateSession,
        measureFirestoreWrite,
        beginTimedPhase,

        // UI 更新コールバック
        onOptimisticMessageAdd: (optimisticMessage, aiMsgId, trace) => {
          responseTimingRef.current = {
            ...responseTimingRef.current,
            traceId: trace,
            aiMessageId: aiMsgId,
            awaitingResponseRender: true,
          };
          setMessages(prev => [...prev, optimisticMessage]);
        },
      });

      if (result.aborted) {
        return;
      }

      if (result.trace) {
        // localStorage に保存（開発モードのみ）
        saveTraceToHistory(result.trace);

        // メモリ内の履歴も更新
        setInspectorTraceHistory((prev) => {
          const next = [result.trace, ...prev.filter((entry) => entry?.turnId !== result.trace.turnId)];
          return next.slice(0, 10); // メモリ上は最大10件
        });
      }

      // Compare mode のキャプチャ
      void runCompareModeCapture({
        agentId: isMaster ? 'master' : agentId,
        userText: result.latestUserText,
        currentReply: result.cleanedResponse,
        context: result.context,
        sessionId,
        messageId: result.aiMsgId,
        usedInternalOS: !!result.continuityInternalOS,
        internalOS: result.continuityInternalOS,
      });

      playSound('receive');
      setIsGenerating(false);
      setGeneratingAgent(null);

      // reactions の事前読み込み
      const pending = lastSubmittedUserMessageRef.current;
      if (!isMaster && sourceMessageId && pending?.text) {
        setAutoExpandReactions({ msgId: result.aiMsgId, isLoading: true });
        void preloadReactions(pending.text, sessionId, sourceMessageId, agentId, result.cleanedResponse).then(async () => {
          // 反応読み込み完了時にセッション切り替えチェック
          if (activeSessionIdRef.current !== sessionId) {
            setAutoExpandReactions(null);
            console.info(`[preloadReactions] Session switched, reactions discarded`);
            return;
          }
          const cached = preloadedReactionsRef.current.get(sourceMessageId);

          if (!cached || cached.sessionId !== sessionId || Object.keys(cached.data).length === 0) {
            setAutoExpandReactions(null);
            return;
          }

          try {
            await measureFirestoreWrite(traceId, 'reaction save', () =>
              updateDoc(
                doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages', result.aiMsgId),
                { reactions: cached.data }
              )
            );
            // 反応保存後もセッション切り替えチェック
            if (activeSessionIdRef.current === sessionId) {
              setAutoExpandReactions({ msgId: result.aiMsgId, isLoading: false });
            } else {
              setAutoExpandReactions(null);
            }
            preloadedReactionsRef.current.delete(sourceMessageId);
          } catch (e) {
            console.error("Failed to save reactions:", e);
            setAutoExpandReactions(null);
          }
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[ai-response:error]", { msg, agentId, sessionId });
      pushAgentDebugEvent({ tag: 'ai-response:error', reason: msg, agentId, sessionId });

      // エラーメッセージを表示
      const currentlyActiveSession = currentSessionIdRef.current === sessionId;
      if (currentlyActiveSession) {
        const debugSuffix = isAgentDebugEnabled() ? ` (msg-preview)` : '';
        if (msg.includes("API key is missing")) {
          setErrorWithAutoDismiss("設定が整うと、視点が応答できるようになります。", 10000);
        } else if (msg.includes("timeout")) {
          setErrorWithAutoDismiss(`応答に少し時間がかかりすぎたようです。少し時間を置いて、もう一度お試しください。${debugSuffix}`);
        } else if (msg.includes("response_check:empty") || msg.includes("Empty response")) {
          setErrorWithAutoDismiss(`うまく応答を受け取れませんでした。少し時間を置いて、もう一度お試しください。${debugSuffix}`);
        } else if (msg.includes("response_check:json_leak")) {
          setErrorWithAutoDismiss(`応答の形が少し乱れてしまいました。もう一度お試しください。${debugSuffix}`);
        } else {
          setErrorWithAutoDismiss(`うまく応答を受け取れませんでした。少し時間を置いて、もう一度お試しください。${debugSuffix}`);
        }
      }
    } finally {
      console.info("[ai-response:finally]", { agentId, sessionId });
      // 無条件で state を復帰（stale closure や条件分岐で state が残るのを防ぐ）
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
      afterglowBySessionRef.current.delete(sessionId);
      if (currentSessionId === sessionId) { setCurrentSessionId(null); resetSessionUIState(true); }
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Failed to delete session", error);
      setErrorWithAutoDismiss("うまく消せませんでした。もう一度お試しください。");
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
    if (!name) { setErrorWithAutoDismiss("お名前を入力してください。そのままでも大丈夫です。"); return; }
    if (!user || !db) { setUserName(name); setIsEditingUserName(false); setTempName(''); return; }

    // Optimistic update: UI を即座に更新
    setUserName(name);
    setIsEditingUserName(false);
    setTempName('');

    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'settings'),
        { displayName: name }, { merge: true }
      );
    } catch (e) {
      console.error("Update user name failed:", e);
      setErrorWithAutoDismiss("お名前の保存に失敗しました。");
      // エラー時は入力欄を再表示して編集を継続可能に
      setIsEditingUserName(true);
      setTempName(name);
    }
  };

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const activeSessionId = currentSessionId || currentSessionIdRef.current;
  const hasPromptForActiveSession =
    messages.some(m => m.role === 'user') ||
    lastSubmittedUserMessageRef.current?.sessionId === activeSessionId;
  const canUseAgents = isAppReady && !isGenerating && !isSending && !!activeSessionId && !!hasPromptForActiveSession;
  // session-scoped loading: full-screen spinner のみ messages が 0 件のときに表示
  const hasVisibleMessages = messages.length > 0;
  const shouldShowFullMessagesLoading = isMessagesLoading && !hasVisibleMessages;
  // delegate bar (委ねる) はセッションが存在すれば表示し、busy 時だけ disabled にする
  // session が存在しかつ非 busy のとき、または入力欄が非表示のときに表示
  const showDelegateBar = (!!activeSessionId && !isGenerating && !isSending) || !showInput;
  const configIssues = [];
  if (!hasFirebaseConfig) {
    configIssues.push({
      id: 'firebase',
      title: 'Firebase設定が未完了です',
      detail: 'VITE_FIREBASE_* を設定すると、セッション保存と会議開始が有効にできます。',
    });
  }
  if (!apiKey) {
    configIssues.push({
      id: 'gemini',
      title: 'Gemini APIキーが未設定です',
      detail: 'VITE_GEMINI_API_KEY を設定すると、各エージェントの応答を生成できます。',
    });
  }
  const hasBlockingConfigIssue = configIssues.length > 0;
  const inputPlaceholder = hasBlockingConfigIssue
    ? '設定が整うと、ここから問いを綴れます'
    : '今ある言葉を、そのまま置いてみてください';
  const composerHelperText = hasBlockingConfigIssue
    ? '設定が整うと、この画面から対話を始められます。'
    : 'Enterで送信 / Shift+Enterで改行';
  const agentHelperText =
    hasBlockingConfigIssue
      ? '設定が整うと、会議メンバーを呼び出せます。'
      : !user
        ? '接続を準備しています…'
        : !activeSessionId
          ? 'まずは「綴る」から、今ある言葉を置いてください。'
          : !hasPromptForActiveSession
            ? '最初の一文を送ると、会議メンバーが応答します。'
            : isGenerating
              ? '声が立ち上がっています…'
              : '気になる視点を選ぶか、「委ねる」で流れに任せられます。';

  const getAgentDisabledReason = () => {
    if (!isAppReady) return 'app-not-ready';
    if (isGenerating) return 'busy:isGenerating';
    if (isSending) return 'busy:isSending';
    if (!activeSessionId) return 'no-session';
    if (!hasPromptForActiveSession) return 'no-prompt';
    return null;
  };
  const agentDisabledReason = getAgentDisabledReason();
  const comparePanelVisible = shouldShowComparePanel({ enabled: isCompareModeEnabled, entries: compareEntries });

  const sidebarTitle =
    sessions.find((s) => s.id === currentSessionId)?.title ||
    optimisticSessionTitles[currentSessionId] ||
    translate(getLang(), 'header.defaultTitle');

  return (
    <div className="lake-bg premium-shell relative min-h-screen overflow-hidden flex font-sans text-slate-800">
      <BackgroundLayer />
      <div
        aria-hidden={showIntro ? 'true' : 'false'}
        className={`flex w-full h-full relative z-10 transition-opacity duration-500 ${isHomeReady || !showIntro ? 'opacity-100' : 'opacity-0'} ${showIntro ? 'pointer-events-none' : ''}`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userName={userName}
          onOpenUserName={() => { setTempName(userName); setIsEditingUserName(true); }}
          onOpenBeliefs={() => { setShowBeliefs(true); setIsSidebarOpen(false); }}
          onNewSession={() => { setCurrentSessionId(null); setIsSidebarOpen(false); resetSessionUIState(true); }}
          sessions={sessions}
          currentSessionId={currentSessionId}
          editingSessionId={editingSessionId}
          editSessionTitle={editSessionTitle}
          onSelectSession={(id) => { setCurrentSessionId(id); setIsSidebarOpen(false); resetSessionUIState(false); }}
          onStartEdit={(id, title) => { setEditingSessionId(id); setEditSessionTitle(title); }}
          onChangeEditTitle={setEditSessionTitle}
          onCommitEditTitle={async (id) => {
            const val = editSessionTitle.trim();
            if (val) await safeUpdateSession(id, { title: val });
            setEditingSessionId(null);
          }}
          onTogglePin={(s) => safeUpdateSession(s.id, { isPinned: !s.isPinned })}
          onRequestDelete={(id) => setDeleteTargetId(id)}
        />

        <div className="flex-1 flex flex-col min-w-0 relative">
          <TopHeader
            title={sidebarTitle}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            modes={MODES}
            selectedMode={selectedMode}
            onChangeMode={setSelectedMode}
          />

          {errorMessage && (
            <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl glass-card border-rose-200/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2 z-40">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold"><AlertCircle size={14}/> {errorMessage}</div>
              <button aria-label="エラーメッセージを閉じる" title="閉じる" onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-full text-rose-400"><X size={14}/></button>
            </div>
          )}

          {hasBlockingConfigIssue && (
            <div className="mx-4 sm:mx-5 mt-3 rounded-3xl glass-card border border-amber-200/60 p-4 sm:p-5 relative z-20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-2xl bg-amber-100 text-amber-700 shrink-0"><AlertCircle size={16} /></div>
                <div className="space-y-2.5">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">この環境では、まだ会議を開始できません</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">不足している設定を補うと、そのままこの画面から対話を始められます。</p>
                  </div>
                  <ul className="space-y-1.5">
                    {configIssues.map((issue) => (
                      <li key={issue.id} className="rounded-2xl bg-white/50 border border-white/70 px-3.5 py-2.5">
                        <p className="text-xs font-black text-slate-700">{issue.title}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{issue.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <ChatTimeline
            ref={scrollRef}
            messages={messages}
            agents={AGENTS}
            isGenerating={isGenerating}
            isSending={isSending}
            isMessagesLoading={isMessagesLoading}
            showInput={showInput}
            generatingAgent={generatingAgent}
            showFullLoading={shouldShowFullMessagesLoading}
            openToolbarMsgId={openToolbarMsgId}
            onToggleToolbar={(id) => setOpenToolbarMsgId(openToolbarMsgId === id ? null : id)}
            onCopy={handleCopyMessage}
            onDelete={handleDeleteMessage}
            copiedMsgId={copiedMsgId}
            activeReaction={activeReaction}
            autoExpandReactions={autoExpandReactions}
            onOpenOthers={(msgId) => {
              if (autoExpandReactions?.msgId === msgId && !activeReaction) {
                setAutoExpandReactions(null);
              } else {
                setActiveReaction(null);
                setAutoExpandReactions({ msgId, isLoading: false });
              }
            }}
            onSelectReaction={(msgId, agentId) => {
              setActiveReaction(
                activeReaction?.msgId === msgId && activeReaction?.agentId === agentId
                  ? null
                  : { msgId, agentId }
              );
              setAutoExpandReactions(null);
            }}
            onCloseOthers={() => setAutoExpandReactions(null)}
            isCompareModeEnabled={isCompareModeEnabled}
            isDebugVisible={isCompareModeEnabled || isAgentDebugEnabled()}
            getOthersState={(msg) => getOthersVisibilityState({
              activeSessionId: currentSessionId,
              hasPromptForActiveSession,
              isMessagesLoading,
              visibleMessagesCount: messages.filter((m) => m.role === 'user' || m.role === 'ai').length,
              compareModeEnabled: isCompareModeEnabled,
              reactions: msg.reactions,
              isGenerating,
            })}
            onHintClick={handleHintClick}
            showMirrorInvite={
              !isGenerating &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'ai' &&
              messages[messages.length - 1].agentId !== 'master' &&
              userMessageCount >= 3
            }
            canUseAgents={canUseAgents}
            onMasterClick={() => handleAgentClick('master', true)}
          />

          {/* 入力エリア — ChatTimeline の下に配置 */}
          <div className="px-4 sm:px-5 pt-2 safe-bottom relative z-30">
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
              {showInput && !isGenerating && !isSending && (
                <Composer
                  ref={textareaRef}
                  userInput={userInput}
                  onChange={setUserInput}
                  onSend={() => handleSend()}
                  onClose={() => setShowInput(false)}
                  onResize={autoResize}
                  disabled={hasBlockingConfigIssue}
                  canSend={!!userInput.trim() && isAppReady}
                  placeholder={inputPlaceholder}
                  helperText={composerHelperText}
                  showCloseButton={messages.length > 0}
                />
              )}
              {showDelegateBar && (
                <AgentControlBar
                  agents={AGENTS}
                  canUseAgents={canUseAgents}
                  isBusy={isGenerating || isSending}
                  helperText={agentHelperText}
                  agentDisabledReason={agentDisabledReason}
                  isDebugMode={isAgentDebugEnabled()}
                  showInput={showInput}
                  onToggleShowInput={setShowInput}
                  onAgentClick={(id) => handleAgentClick(id)}
                  onMasterClick={() => handleAgentClick('master', true)}
                  onRandomResponse={handleRandomResponse}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <IntroOverlay
        visible={showIntro}
        isHomeReady={isHomeReady}
        hasBlockingConfigIssue={hasBlockingConfigIssue}
        onStart={handleStartIntro}
      />

      <UserNameDialog
        open={isEditingUserName}
        tempName={tempName}
        onChange={setTempName}
        onConfirm={handleUpdateUserName}
        onCancel={() => setIsEditingUserName(false)}
      />

      <DeleteSessionDialog
        open={!!deleteTargetId}
        isDeleting={isDeletingSession}
        onConfirm={() => { playSound('delete'); handleDeleteSession(deleteTargetId); }}
        onCancel={() => setDeleteTargetId(null)}
      />

      <BeliefsDialog
        open={showBeliefs}
        agents={AGENTS}
        onClose={() => setShowBeliefs(false)}
      />

      {comparePanelVisible && (
        <CompareModePanel
          enabled={isCompareModeEnabled}
          entries={compareEntries}
          collapsed={isCompareCollapsed}
          onToggleCollapse={() => setIsCompareCollapsed(prev => !prev)}
          onToggleLabel={handleToggleCompareLabel}
        />
      )}


      <FloatingAgentBar
        activeSessionId={activeSessionId}
        hasMessages={messages.length > 0}
        canUseAgents={canUseAgents}
        isGenerating={isGenerating}
        isSending={isSending}
        agentDisabledReason={agentDisabledReason}
        compareModeEnabled={isCompareModeEnabled}
        isDebugMode={isAgentDebugEnabled()}
        isDebugPanelVisible={isAgentDebugEnabled()}
        onRandomResponse={handleRandomResponse}
        onAgentClick={handleAgentClick}
        onScrollToOthers={() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
          }
        }}
        agents={AGENTS}
      />

      {devDebugRuntime.shouldBuildAgentDebugPreview && (
        <SurfaceDebugPanel
          entries={surfaceDebugEntries}
          onClear={clearSurfaceDebugEntries}
        />
      )}

      {devDebugRuntime.shouldRenderJoeDebugPanel && joeDebugEntry && (
        <JoeDebugPanel
          entry={joeDebugEntry}
          onClose={() => handleJoeDebugVisibilityChange(false)}
        />
      )}

      {isAgentDebugEnabled() && (
        <AgentGateDebugPanel
          isAppReady={isAppReady}
          isGenerating={isGenerating}
          isSending={isSending}
          showInput={showInput}
          activeSessionId={activeSessionId}
          hasPromptForActiveSession={hasPromptForActiveSession}
          showDelegateBar={showDelegateBar}
          canUseAgents={canUseAgents}
          messagesCount={messages.length}
          visibleMessagesCount={messages.filter(m => m.role !== 'system').length}
          currentSessionId={currentSessionId}
          generatingAgent={generatingAgent}
          agentDebugEvents={agentDebugEvents}
          isMessagesLoading={isMessagesLoading}
          compareModeEnabled={isCompareModeEnabled}
        />
      )}

      {isInspectorPanelVisible && (
        <AgentInspectorPanel
          trace={inspectorTraceHistory[0] ?? null}
          history={inspectorTraceHistory}
          onClose={() => {
            setInspectorEnabled(false);
            setIsInspectorPanelVisible(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
