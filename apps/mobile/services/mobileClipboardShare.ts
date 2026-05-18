import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

export type MobileShareOutcome = 'shared' | 'copied' | 'dismissed';

function isShareAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === 'AbortError'
    || message.includes('cancel')
    || message.includes('dismiss')
    || message.includes('abort')
  );
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export async function shareText(text: string, title?: string): Promise<MobileShareOutcome> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        return 'shared';
      } catch (error) {
        if (isShareAbortError(error)) return 'dismissed';
        throw error;
      }
    }

    await copyTextToClipboard(text);
    return 'copied';
  }

  const result = await Share.share({
    title,
    message: text,
  });

  if (result.action === Share.dismissedAction) {
    return 'dismissed';
  }

  return 'shared';
}
