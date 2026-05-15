import React, { memo } from 'react';
import { Users, Copy, Check, Trash2 } from 'lucide-react';
import ReactionPanel from './ReactionPanel';
import OthersPanel from './OthersPanel';

/**
 * 単一メッセージのバブル + ツールバー + OTHERS タブ + 個別 reaction の集合体。
 * - ユーザー発言は右寄せ・濃色、AI発言は左寄せ・白磁。
 * - ツールバー (copy/delete) は普段隠れていて、hover/tap でのみ現れる。
 * - OTHERS は本文の下に小さなタブで畳まれている。展開すると静かに広がる。
 */
const MessageBubble = ({
  msg,
  agent,
  agents,
  isOpenToolbar,
  onToggleToolbar,
  onCopy,
  onDelete,
  copiedMsgId,
  // OTHERS visibility
  othersState,
  activeReaction,
  autoExpandReactions,
  onOpenOthers,
  onSelectReaction,
  onCloseOthers,
  isCompareModeEnabled,
  isDebugVisible,
}) => {
  const isUser = msg.role === 'user';
  const isMaster = msg.agentId === 'master';

  const showOthersTabs =
    !isUser &&
    othersState.shouldRenderOthers &&
    othersState.hasReactionData;

  const showOthersEmpty =
    !isUser &&
    isCompareModeEnabled &&
    othersState.shouldRenderOthers &&
    !othersState.hasReactionData;

  return (
    <div
      className="group/msg mb-10 sm:mb-12 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-start"
    >
      <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 ml-1">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.18em] uppercase">
              {agent?.name || '—'}
            </span>
            {isMaster && (
              <span className="bg-indigo-50/70 text-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-indigo-100/60">
                総括
              </span>
            )}
          </div>
        )}

        <div
          onClick={() => onToggleToolbar(msg.id)}
          className={`relative px-5 sm:px-6 py-4 sm:py-5 whitespace-pre-wrap text-[15px] leading-[1.85] rounded-[1.75rem] transition-all cursor-pointer border jk-prose ${
            isUser
              ? 'message-user text-slate-100 max-w-[88%] sm:max-w-[78%]'
              : 'message-agent mirror-reflection text-slate-700 max-w-full sm:max-w-[92%]'
          }`}
        >
          {msg.content}

          {msg.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-2 right-2 flex items-center gap-1 p-1 rounded-lg transition-opacity ${
                isUser ? 'bg-slate-700/55' : 'bg-white/60 shadow-sm'
              } ${isOpenToolbar ? 'opacity-100' : 'opacity-0 md:group-hover/msg:opacity-100 focus-within:opacity-100'}`}
            >
              <button
                type="button"
                aria-label="メッセージをコピー"
                title="メッセージをコピー"
                onClick={() => {
                  onCopy(msg.id, msg.content);
                  onToggleToolbar(null);
                }}
                className="p-1 text-slate-400 hover:text-indigo-500 jk-no-min-tap"
              >
                {copiedMsgId === msg.id ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
              </button>
              <button
                type="button"
                aria-label="メッセージを削除"
                title="メッセージを削除"
                onClick={() => {
                  onDelete(msg.id);
                  onToggleToolbar(null);
                }}
                className="p-1 text-slate-400 hover:text-rose-500 jk-no-min-tap"
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </div>
          )}

          {showOthersTabs && (
            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/30">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOthers(msg.id);
                }}
                aria-pressed={autoExpandReactions?.msgId === msg.id && !activeReaction}
                className={`px-3 py-1.5 rounded-full border text-[10px] font-black transition-all flex items-center gap-1.5 ${
                  autoExpandReactions?.msgId === msg.id && !activeReaction
                    ? 'bg-slate-800 text-white border-slate-900 shadow-md'
                    : 'bg-white/50 text-slate-500 border-white/70 hover:bg-white/75'
                }`}
              >
                <Users size={11} aria-hidden="true" /> OTHERS
                {isDebugVisible && (
                  <span className="text-[8px] opacity-60 ml-0.5">({othersState.othersCount})</span>
                )}
              </button>
              {Object.entries(msg.reactions).map(([rId]) => {
                const rAgent = agents.find((a) => a.id === rId);
                if (!rAgent) return null;
                const isSelected =
                  activeReaction?.msgId === msg.id && activeReaction?.agentId === rId;
                return (
                  <button
                    type="button"
                    key={rId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReaction(msg.id, rId);
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${rAgent.name} の反応を見る`}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-black transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-900'
                        : 'bg-white/50 text-slate-500 border-white/70 hover:bg-white/75'
                    }`}
                  >
                    {rAgent.icon} {rAgent.name}
                  </button>
                );
              })}
            </div>
          )}

          {showOthersEmpty && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users size={10} aria-hidden="true" /> OTHERS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                まだ比較対象がありません
              </p>
            </div>
          )}
        </div>

        {!isUser && activeReaction?.msgId === msg.id && msg.reactions?.[activeReaction.agentId] && (
          <ReactionPanel
            agent={agents.find((a) => a.id === activeReaction.agentId)}
            reaction={msg.reactions[activeReaction.agentId]}
          />
        )}

        {!isUser && autoExpandReactions?.msgId === msg.id && !activeReaction && (
          <OthersPanel
            reactions={msg.reactions}
            agents={agents}
            isLoading={autoExpandReactions.isLoading}
            isDebugVisible={isDebugVisible}
            isCompareModeEnabled={isCompareModeEnabled}
            onClose={onCloseOthers}
          />
        )}
      </div>
    </div>
  );
};

export default memo(MessageBubble);
