// src/components/ApiSelectionPanel.jsx
// Modal panel to select the surface API provider.
// Triggered from the header. Available only when the app is ready.

import React from 'react';
import { X, Check } from 'lucide-react';
import { API_PROVIDERS } from '../config/apiProviders.js';

/**
 * @param {{
 *   baseProvider: import('../types/apiProvider.js').ApiProviderId,
 *   onSelect: (id: import('../types/apiProvider.js').ApiProviderId) => void,
 *   onClose: () => void,
 * }} props
 */
const ApiSelectionPanel = ({ baseProvider, onSelect, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'rgba(248,250,252,0.97)', border: '1px solid rgba(148,163,184,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
          <h2 className="text-sm font-black text-slate-800">基準API 選択</h2>
          <button
            aria-label="閉じる"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
            基準APIは最終発話の表面にだけ影響します。Node / Home / Revision / Memory は共通です。
          </p>
        </div>

        {/* Provider list */}
        <ul className="px-5 pt-3 pb-5 space-y-2">
          {API_PROVIDERS.map((provider) => {
            const isSelected = provider.id === baseProvider;
            const isDisabled = !provider.available;
            return (
              <li key={provider.id}>
                <button
                  disabled={isDisabled}
                  onClick={() => { if (!isDisabled) { onSelect(provider.id); onClose(); } }}
                  className={[
                    'w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200/70 shadow-sm'
                      : isDisabled
                        ? 'bg-slate-50/70 border border-slate-200/40 opacity-50 cursor-not-allowed'
                        : 'bg-white/60 border border-slate-200/50 hover:bg-indigo-50/50 hover:border-indigo-200/50 cursor-pointer',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black ${isSelected ? 'text-indigo-700' : isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                        {provider.label}
                      </span>
                      {isDisabled && (
                        <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/60">
                          近日公開
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {provider.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ApiSelectionPanel;
