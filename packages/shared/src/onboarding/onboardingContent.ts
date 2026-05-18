import type { UniversalOnboardingContent } from './onboardingTypes';

export const UNIVERSAL_ONBOARDING_CONTENT: UniversalOnboardingContent = {
  eyebrow: 'Inner Conference Room',
  title: 'じぶん会議',
  supportingText: '5つの視点で、じぶんに潜る',
  subtitle: '導かない。照らすだけ。歩くのは、あなた自身。',
  steps: [
    {
      id: 'write-question',
      title: '問いを書く',
      body: 'まだ言葉になりきっていなくても、そのまま置いてみます。',
    },
    {
      id: 'invite-voices',
      title: '視点を呼ぶ',
      body: 'レイ、ジョー、ケン、ミナ、サトウ、心の鏡。今の自分に合う声を選べます。',
    },
    {
      id: 'reflect',
      title: '心の鏡で映す',
      body: 'ひとつの正解ではなく、複数の見え方から自分の輪郭を見つめます。',
    },
  ],
  primaryCta: '会議をはじめる',
  secondaryCta: '名前を整える',
  nameLabel: 'お名前',
  namePlaceholder: 'あなた',
  nameHelp: '会議メンバーからの呼ばれ方に使われます。24文字まで。',
};
