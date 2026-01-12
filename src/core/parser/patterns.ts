/**
 * WhatsApp Chat Export Patterns
 * Supports various formats (iOS, Android, etc.)
 */

export const WHATSAPP_PATTERNS = {
    // iOS Format: [DD/MM/YY, HH:MM:SS] Sender: Content
    // Android Format: DD/MM/YY, HH:MM - Sender: Content
    // We use a flexible regex to detect the start of a new message

    iOS: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s[AP]M)?)\]\s([^:]+):\s(.*)$/,
    Android: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.*)$/,

    // Generic pattern for detecting a line starting with a date (for multiline messages)
    lineStart: /^\[?\d{1,2}\/\d{1,2}\/\d{2,4}/,

    // System messages (e.g., encryption warnings, group changes)
    systemIOS: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s[AP]M)?)\]\s(.*)$/,
    systemAndroid: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s-\s(.*)$/,
};

export function detectFormat(line: string): 'iOS' | 'Android' | 'unknown' {
    if (WHATSAPP_PATTERNS.iOS.test(line)) return 'iOS';
    if (WHATSAPP_PATTERNS.Android.test(line)) return 'Android';
    return 'unknown';
}
