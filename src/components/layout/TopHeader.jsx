import React from 'react';
import { Menu } from 'lucide-react';

/**
 * 上部ヘッダー: メニュー / セッションタイトル / モード選択。
 * 上部バーは「いま、どのセッションのどのモードか」を静かに示す情報帯であり、
 * 下部 FloatingAgentBar と競合しないよう、視覚的に主張を抑える。
 */
const TopHeader = ({
  title,
  onOpenSidebar,
  modes,
  selectedMode,
  onChangeMode,
}) => (
  <header
    className="header-shell flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 gap-2 mx-3 mt-3 sm:mx-4 sm:mt-4"
    style={{ borderRadius: '24px', zIndex: 10 }}
  >
    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <button
        type="button"
        aria-label="メニューを開く"
        title="メニューを開く"
        onClick={onOpenSidebar}
        className="md:hidden p-2 -ml-2 text-slate-500 shrink-0 rounded-xl hover:bg-white/40"
      >
        <Menu size={18} aria-hidden="true" />
      </button>
      <h2
        className="font-bold text-sm tracking-tight truncate text-slate-800"
        title={title}
      >
        {title}
      </h2>
    </div>

    <div
      className="flex p-1 rounded-2xl neu-concave shrink-0"
      role="group"
      aria-label="応答モード"
    >
      {Object.entries(modes).map(([key, m]) => {
        const isActive = selectedMode === key;
        return (
          <button
            type="button"
            key={key}
            aria-label={`応答モード: ${m.label}`}
            aria-pressed={isActive}
            title={m.label}
            onClick={() => onChangeMode(key)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${
              isActive
                ? 'bg-white/70 text-slate-900 shadow-sm border border-white/60'
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
            }`}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  </header>
);

export default TopHeader;
