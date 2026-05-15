import React from 'react';
import { Loader2, Compass } from 'lucide-react';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';
import ThinkingIndicator from './ThinkingIndicator';

/**
 * メッセージ列のタイムライン全体。
 * - 空状態 / メッセージ列 / 生成中 / 心の鏡への誘い、を順に描画する。
 * - スクロール領域はここで持つが、scroll 制御は親 (App) が ref で行う。
 */
const ChatTimeline = React.forwardRef(function ChatTimeline(
  {
    messages,
    agents,
    isGenerating,
    isSending,
    isMessagesLoading,
    showInput,
    generatingAgent,
    showFullLoading,
    openToolbarMsgId,
    onToggleToolbar,
    onCopy,
    onDelete,
    copiedMsgId,
    activeReaction,
    autoExpandReactions,
    onOpenOthers,
    onSelectReaction,
    onCloseOthers,
    isCompareModeEnabled,
    isDebugVisible,
    getOthersState,
    onHintClick,
    showMirrorInvite,
    canUseAgents,
    onMasterClick,
  },
  scrollRef,
) {
  return (
    <main
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-10 no-scrollbar relative z-10"
    >
      <div className="max-w-2xl mx-auto pb-32 sm:pb-40">
        {showFullLoading ? (
          <div className="flex justify-center py-20" role="status" aria-live="polite">
            <Loader2 className="animate-spin text-slate-400" size={32} aria-hidden="true" />
            <span className="sr-only">読み込み中</span>
          </div>
        ) : (
          <>
            {messages.length === 0 && !isGenerating && !isSending && showInput && (
              <EmptyState onHintClick={onHintClick} />
            )}

            {messages.map((msg, i) => {
              const agent =
                agents.find((a) => a.id === msg.agentId) ||
                (msg.agentId === 'master' ? { name: '心の鏡' } : null);
              const othersState = getOthersState(msg);
              return (
                <MessageBubble
                  key={msg.id || i}
                  msg={msg}
                  agent={agent}
                  agents={agents}
                  isOpenToolbar={openToolbarMsgId === msg.id}
                  onToggleToolbar={onToggleToolbar}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  copiedMsgId={copiedMsgId}
                  othersState={othersState}
                  activeReaction={activeReaction}
                  autoExpandReactions={autoExpandReactions}
                  onOpenOthers={onOpenOthers}
                  onSelectReaction={onSelectReaction}
                  onCloseOthers={onCloseOthers}
                  isCompareModeEnabled={isCompareModeEnabled}
                  isDebugVisible={isDebugVisible}
                />
              );
            })}

            {isGenerating && (
              <ThinkingIndicator
                agentName={generatingAgent?.name}
                agentId={generatingAgent?.id}
              />
            )}

            {showMirrorInvite && (
              <div className="flex justify-center mt-12 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <button
                  type="button"
                  onClick={onMasterClick}
                  disabled={!canUseAgents}
                  aria-label="心の鏡で、ここまでの声を映す"
                  className="mirror-invite group disabled:opacity-30"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-105 transition-transform">
                    <Compass size={18} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black text-slate-700">
                      ここまでの声を映してみますか？
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      心の鏡が、散らばった思考を総括します
                    </span>
                  </div>
                </button>
              </div>
            )}
          </>
        )}
        {isMessagesLoading && messages.length > 0 && !showFullLoading && (
          <span className="sr-only" role="status" aria-live="polite">
            メッセージを同期しています
          </span>
        )}
      </div>
    </main>
  );
});

export default ChatTimeline;
