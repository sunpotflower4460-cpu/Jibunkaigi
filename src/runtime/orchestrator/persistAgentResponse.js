// src/runtime/orchestrator/persistAgentResponse.js
// AI 応答の永続化を担当するモジュール
//
// 責務:
// - Firestore への message 保存
// - afterglow の更新
// - compare mode のキャプチャ
// - reactions の事前読み込み

import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { buildNextAfterglow } from '../afterglow.js';

export const extractResponseEcho = (responseText = '') => {
  if (!responseText || typeof responseText !== 'string') return '';

  const cleaned = responseText
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const sentences = cleaned
    .split(/(?<=[。！？!?])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 2).join('');
};

/**
 * AI メッセージを Firestore に保存する
 */
export const persistAiMessage = async ({
  db,
  appId,
  user,
  sessionId,
  aiMsgId,
  optimisticAiMessageForStorage,
  measureFirestoreWrite,
  traceId,
}) => {
  await measureFirestoreWrite(traceId, 'AI response save', () =>
    setDoc(
      doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages', aiMsgId),
      { ...optimisticAiMessageForStorage, createdAt: serverTimestamp() }
    )
  );
};

/**
 * afterglow を更新する
 */
export const updateAfterglow = async ({
  sessionId,
  continuityInternalOS,
  agentId,
  isMaster,
  cleanedResponse = '',
  readSessionAfterglow,
  writeSessionAfterglowLocal,
  safeUpdateSession,
}) => {
  const nextAfterglow = buildNextAfterglow({
    previousAfterglow: readSessionAfterglow(sessionId),
    latentState: continuityInternalOS?.latentState,
    patternMix: continuityInternalOS?.patternMix,
    respondingAgentId: isMaster ? 'master' : agentId,
    isMaster,
  });
  nextAfterglow.previousResponseEcho = extractResponseEcho(cleanedResponse);

  writeSessionAfterglowLocal(sessionId, nextAfterglow);
  await safeUpdateSession(sessionId, { afterglow: nextAfterglow, updatedAt: serverTimestamp() });

  return nextAfterglow;
};

/**
 * reactions を Firestore に保存する
 */
export const persistReactions = async ({
  db,
  appId,
  user,
  sessionId,
  aiMsgId,
  reactions,
  measureFirestoreWrite,
  traceId,
}) => {
  await measureFirestoreWrite(traceId, 'reaction save', () =>
    updateDoc(
      doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', sessionId, 'messages', aiMsgId),
      { reactions }
    )
  );
};

/**
 * AI 応答と関連データを全て永続化する
 */
export const persistAgentResponse = async ({
  db,
  appId,
  user,
  sessionId,
  aiMsgId,
  optimisticAiMessageForStorage,
  continuityInternalOS,
  agentId,
  isMaster,
  cleanedResponse = '',
  measureFirestoreWrite,
  traceId,
  readSessionAfterglow,
  writeSessionAfterglowLocal,
  safeUpdateSession,
  pushAgentDebugEvent,
}) => {
  // 1. AI メッセージを保存
  console.info("[ai-response:before-save]", { agentId, sessionId });
  pushAgentDebugEvent({ tag: 'ai-response:before-save', agentId, sessionId });

  await persistAiMessage({
    db,
    appId,
    user,
    sessionId,
    aiMsgId,
    optimisticAiMessageForStorage,
    measureFirestoreWrite,
    traceId,
  });

  console.info("[ai-response:after-save]", { agentId, sessionId });
  pushAgentDebugEvent({ tag: 'ai-response:after-save', agentId, sessionId });

  // 2. afterglow を更新
  const nextAfterglow = await updateAfterglow({
    sessionId,
    continuityInternalOS,
    agentId,
    isMaster,
    cleanedResponse,
    readSessionAfterglow,
    writeSessionAfterglowLocal,
    safeUpdateSession,
  });

  return {
    nextAfterglow,
  };
};
