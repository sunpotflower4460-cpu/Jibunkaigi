import React from 'react';
import { Zap, MessageSquare, LayoutDashboard } from 'lucide-react';

/**
 * 応答モード — 一閃 / 対話 / 深淵。
 * UI 表示と AI への制約 (constraint) の両方を持つ。
 * 既存挙動に直結するため constraint 文字列は安易に変えないこと。
 */
export const MODES = {
  short: {
    id: 'short',
    label: '一閃',
    icon: <Zap size={14} />,
    constraint:
      '核心を突く短文のみ。挨拶不要。1〜2文で終わること。最後に内省を促す短い問いを1つだけ。',
  },
  medium: {
    id: 'medium',
    label: '対話',
    icon: <MessageSquare size={14} />,
    constraint:
      '3〜5文程度。相手の気持ちを受け取った上で、自己理解を深める問いかけを1つ行うこと。',
  },
  long: {
    id: 'long',
    label: '深淵',
    icon: <LayoutDashboard size={14} />,
    constraint:
      '8文程度まで。キャラクターの個性を活かしながら、多角的な視点で掘り下げる。ただし詩的すぎる表現は避け、伝わりやすい言葉を使うこと。',
  },
};

export const MODE_KEYS = ['short', 'medium', 'long'];

export const getMode = (key) => MODES[key] || MODES.medium;
