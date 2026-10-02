/** Tokito Music design tokens — one meaning per color. */
export const C = {
  bg: "#121212",
  surface: "#1C1C1F",
  surface2: "#222226",
  // brand + actions
  accent: "#BC8CF2",
  onAccent: "#141414",
  // semantic icons
  like: "#FF5C7A", // hearts, liked states
  trending: "#FF9F43", // flame, charts
  neutral: "#8E8E93", // history, time, chevrons, secondary actions
  success: "#3DDC84", // availability, confirmations
  danger: "#FF8080",
  // text
  text: "#FFFFFF",
  textDim: "#AEAEB2",
  textFaint: "#717173",
} as const;

/** Translucent tint background for an icon tile. */
export function tint(hex: string, alpha = 0.16): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
