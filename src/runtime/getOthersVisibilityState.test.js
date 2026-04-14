// src/runtime/getOthersVisibilityState.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOthersVisibilityState,
  getOthersEmptyMessage,
  getOthersDebugLabel,
} from './getOthersVisibilityState.js';

describe('getOthersVisibilityState', () => {
  it('returns no-session reason when no active session', () => {
    const result = getOthersVisibilityState({
      activeSessionId: null,
      hasPromptForActiveSession: false,
      isMessagesLoading: false,
      visibleMessagesCount: 0,
      compareModeEnabled: false,
    });

    assert.equal(result.shouldRenderOthers, false);
    assert.equal(result.reason, 'no-session');
    assert.equal(result.hasActiveSession, false);
  });

  it('returns no-prompt reason when no prompt for active session in normal mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: false,
      isMessagesLoading: false,
      visibleMessagesCount: 0,
      compareModeEnabled: false,
    });

    assert.equal(result.shouldRenderOthers, false);
    assert.equal(result.reason, 'no-prompt');
    assert.equal(result.hasActiveSession, true);
    assert.equal(result.hasPromptForActiveSession, false);
  });

  it('shows OTHERS with no-prompt reason in compare mode even without prompt', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: false,
      isMessagesLoading: false,
      visibleMessagesCount: 1,
      compareModeEnabled: true,
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'no-prompt');
    assert.equal(result.compareModeEnabled, true);
  });

  it('returns loading reason during message loading in compare mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: true,
      visibleMessagesCount: 1,
      compareModeEnabled: true,
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'loading');
    assert.equal(result.shouldShowLoading, true);
  });

  it('returns no-candidates reason when no reactions in compare mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 2,
      compareModeEnabled: true,
      reactions: null,
      isGenerating: false,
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'no-candidates');
    assert.equal(result.othersCount, 0);
  });

  it('returns ok reason when reactions exist in compare mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 2,
      compareModeEnabled: true,
      reactions: { agent1: {}, agent2: {}, agent3: {} },
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'ok');
    assert.equal(result.othersCount, 3);
    assert.equal(result.hasReactionData, true);
  });

  it('hides OTHERS in normal mode when no reactions', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 2,
      compareModeEnabled: false,
      reactions: null,
    });

    assert.equal(result.shouldRenderOthers, false);
    assert.equal(result.reason, 'no-candidates');
  });

  it('shows OTHERS in normal mode when reactions exist', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 2,
      compareModeEnabled: false,
      reactions: { agent1: {}, agent2: {} },
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'ok');
    assert.equal(result.othersCount, 2);
  });

  it('returns no-visible-messages reason when visibleMessagesCount is 0', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 0,
      compareModeEnabled: false,
    });

    assert.equal(result.shouldRenderOthers, false);
    assert.equal(result.reason, 'no-visible-messages');
  });

  it('shows OTHERS with no-visible-messages in compare mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 0,
      compareModeEnabled: true,
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'no-visible-messages');
  });

  it('shows generating state in compare mode', () => {
    const result = getOthersVisibilityState({
      activeSessionId: 'session-123',
      hasPromptForActiveSession: true,
      isMessagesLoading: false,
      visibleMessagesCount: 2,
      compareModeEnabled: true,
      reactions: null,
      isGenerating: true,
    });

    assert.equal(result.shouldRenderOthers, true);
    assert.equal(result.reason, 'generating');
    assert.equal(result.shouldShowLoading, true);
  });
});

describe('getOthersEmptyMessage', () => {
  it('returns appropriate message for no-session', () => {
    const msg = getOthersEmptyMessage('no-session', false);
    assert.ok(msg.includes('会話を始める'));
  });

  it('returns appropriate message for no-prompt', () => {
    const msg = getOthersEmptyMessage('no-prompt', false);
    assert.ok(msg.includes('まず1回会話'));
  });

  it('returns appropriate message for loading', () => {
    const msg = getOthersEmptyMessage('loading', false);
    assert.ok(msg.includes('読み込み中'));
  });

  it('returns appropriate message for no-candidates', () => {
    const msg = getOthersEmptyMessage('no-candidates', false);
    assert.ok(msg.includes('比較対象がありません'));
  });

  it('returns appropriate message for generating', () => {
    const msg = getOthersEmptyMessage('generating', false);
    assert.ok(msg.includes('生成中'));
  });

  it('returns empty string for ok reason', () => {
    const msg = getOthersEmptyMessage('ok', false);
    assert.equal(msg, '');
  });
});

describe('getOthersDebugLabel', () => {
  it('returns ready label when state is ok', () => {
    const state = {
      reason: 'ok',
      othersCount: 3,
      hasReactionData: true,
    };
    const label = getOthersDebugLabel(state);
    assert.equal(label, 'OTHERS: ready (3)');
  });

  it('returns loading label when state is loading', () => {
    const state = {
      reason: 'loading',
      othersCount: 0,
      hasReactionData: false,
    };
    const label = getOthersDebugLabel(state);
    assert.equal(label, 'OTHERS: loading');
  });

  it('returns no prompt label when state is no-prompt', () => {
    const state = {
      reason: 'no-prompt',
      othersCount: 0,
      hasReactionData: false,
    };
    const label = getOthersDebugLabel(state);
    assert.equal(label, 'OTHERS: no prompt yet');
  });

  it('returns no candidates label when state is no-candidates', () => {
    const state = {
      reason: 'no-candidates',
      othersCount: 0,
      hasReactionData: false,
    };
    const label = getOthersDebugLabel(state);
    assert.equal(label, 'OTHERS: no candidates');
  });

  it('returns generating label when state is generating', () => {
    const state = {
      reason: 'generating',
      othersCount: 0,
      hasReactionData: false,
    };
    const label = getOthersDebugLabel(state);
    assert.equal(label, 'OTHERS: generating');
  });

  it('returns unknown label when state is null', () => {
    const label = getOthersDebugLabel(null);
    assert.equal(label, 'OTHERS: unknown');
  });
});
