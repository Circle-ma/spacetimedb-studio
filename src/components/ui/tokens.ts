import type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  LetterSpacingToken,
  LineHeightToken,
  RadiusToken,
  ShadowToken,
  SizeToken,
  SpacingToken,
  ZIndexToken,
} from "styled-system/types/tokens";

export type {
  ColorToken,
  FontSizeToken,
  FontWeightToken,
  LetterSpacingToken,
  LineHeightToken,
  RadiusToken,
  ShadowToken,
  SizeToken,
  SpacingToken,
  ZIndexToken,
};

/**
 * Standard 4px / 8px Spacing Grid Rail
 * Pre-approved layout rhythms for gap and padding.
 */
export const SPACING_SCALE = [
  "0",
  "1", // 4px
  "1.5", // 6px
  "2", // 8px
  "2.5", // 10px
  "3", // 12px
  "4", // 16px
  "5", // 20px
  "6", // 24px
  "8", // 32px
  "10", // 40px
  "12", // 48px
  "16", // 64px
  "20", // 80px
] as const;

/**
 * Canonical Semantic Surfaces
 */
export const SURFACES = {
  canvas: "bg.canvas",
  default: "bg.default",
  subtle: "bg.subtle",
  muted: "bg.muted",
} as const;

/**
 * Canonical Semantic Foregrounds
 */
export const FOREGROUNDS = {
  default: "fg.default",
  muted: "fg.muted",
  subtle: "fg.subtle",
} as const;

/**
 * Canonical Semantic Borders
 */
export const BORDERS = {
  subtle: "border.subtle",
  default: "border.default",
} as const;

/**
 * Canonical Semantic Status Colors
 */
export const STATUS_COLORS = {
  danger: {
    default: "danger.default",
    subtle: "danger.subtle",
    border: "danger.border",
    fg: "danger.fg",
  },
  success: {
    default: "success.default",
    subtle: "success.subtle",
    border: "success.border",
    fg: "success.fg",
  },
} as const;
