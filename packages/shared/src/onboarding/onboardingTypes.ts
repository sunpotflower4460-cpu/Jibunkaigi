export interface UniversalOnboardingStep {
  id: string;
  title: string;
  body: string;
  cta?: string;
}

export interface UniversalOnboardingContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  supportingText?: string;
  steps: UniversalOnboardingStep[];
  primaryCta: string;
  secondaryCta?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  nameHelp?: string;
}
