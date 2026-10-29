import { defineConfig, defineRecipe, defineSlotRecipe } from "@pandacss/dev";

const buttonRecipe = defineRecipe({
  className: "button",
  description: "Standard button recipe",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "md",
    fontWeight: "medium",
    cursor: "pointer",
    transitionProperty: "colors, box-shadow",
    transitionDuration: "fast",
    outline: "none",
    userSelect: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "accent.default",
      outlineOffset: "2px",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      pointerEvents: "none",
    },
  },
  variants: {
    variant: {
      solid: {
        bg: "accent.default",
        color: "accent.fg",
        _hover: { bg: "accent.emphasized" },
      },
      outline: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        color: "fg.default",
        bg: "transparent",
        _hover: { bg: "bg.subtle" },
      },
      ghost: {
        bg: "transparent",
        color: "fg.default",
        _hover: { bg: "bg.subtle" },
      },
      subtle: {
        bg: "bg.subtle",
        color: "fg.default",
        _hover: { bg: "bg.muted" },
      },
    },
    size: {
      xs: { h: "7", px: "2.5", textStyle: "xs", gap: "1.5" },
      sm: { h: "8", px: "3", textStyle: "sm", gap: "2" },
      md: { h: "9", px: "4", textStyle: "sm", gap: "2" },
      lg: { h: "10", px: "5", textStyle: "md", gap: "2.5" },
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});

const badgeRecipe = defineRecipe({
  className: "badge",
  description: "Standard badge recipe",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "full",
    fontWeight: "medium",
    lineHeight: "1",
    whiteSpace: "nowrap",
  },
  variants: {
    variant: {
      solid: {
        bg: "accent.default",
        color: "accent.fg",
      },
      subtle: {
        bg: "bg.subtle",
        color: "fg.default",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.subtle",
      },
      outline: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        color: "fg.default",
      },
    },
    size: {
      sm: { px: "2", py: "1", textStyle: "xs" },
      md: { px: "2.5", py: "1", textStyle: "sm" },
    },
  },
  defaultVariants: {
    variant: "subtle",
    size: "sm",
  },
});

const textRecipe = defineRecipe({
  className: "text",
  description: "Canonical typography recipe",
  base: {
    color: "fg.default",
  },
  variants: {
    variant: {
      heading: {
        fontWeight: "bold",
        letterSpacing: "tight",
        lineHeight: "tight",
      },
      body: {
        fontWeight: "normal",
        lineHeight: "relaxed",
      },
      code: {
        fontFamily: "mono",
        bg: "bg.subtle",
        borderRadius: "sm",
        px: "1.5",
        py: "0.5",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.subtle",
      },
    },
    size: {
      xs: { textStyle: "xs" },
      sm: { textStyle: "sm" },
      md: { textStyle: "md" },
      lg: { textStyle: "lg" },
      xl: { textStyle: "xl" },
      "2xl": { textStyle: "2xl" },
      "3xl": { textStyle: "3xl" },
    },
  },
  defaultVariants: {
    variant: "body",
    size: "md",
  },
});

const cardSlotRecipe = defineSlotRecipe({
  className: "card",
  description: "Card component slot recipe",
  slots: ["root", "header", "title", "description", "body", "footer"],
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "6",
      p: "6",
      borderRadius: "l3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.subtle",
      bg: "bg.default",
      boxShadow: "sm",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      w: "full",
    },
    title: {
      textStyle: "lg",
      fontWeight: "semibold",
      letterSpacing: "tight",
      color: "fg.default",
    },
    description: {
      textStyle: "sm",
      color: "fg.muted",
      lineHeight: "relaxed",
    },
    body: {
      display: "flex",
      flexDirection: "column",
      gap: "4",
      w: "full",
    },
    footer: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "3",
      w: "full",
    },
  },
});

const dialogSlotRecipe = defineSlotRecipe({
  className: "dialog",
  description: "Dialog component slot recipe",
  slots: ["backdrop", "positioner", "content", "title", "description", "closeTrigger"],
  base: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: "overlay",
      backdropBlur: "sm",
      bg: "rgba(0, 0, 0, 0.5)",
    },
    positioner: {
      position: "fixed",
      inset: "0",
      zIndex: "modal",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: { base: "4", sm: "6" },
      overflowY: "auto",
    },
    content: {
      position: "relative",
      w: "full",
      maxW: "md",
      bg: "bg.default",
      p: "6",
      borderRadius: "l3",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.subtle",
      boxShadow: "xl",
      display: "flex",
      flexDirection: "column",
      gap: "5",
      color: "fg.default",
    },
    title: {
      textStyle: "lg",
      fontWeight: "semibold",
      color: "fg.default",
      lineHeight: "snug",
      letterSpacing: "tight",
    },
    description: {
      textStyle: "sm",
      color: "fg.muted",
      lineHeight: "relaxed",
    },
    closeTrigger: {
      position: "absolute",
      top: "4",
      right: "4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      w: "7",
      h: "7",
      borderRadius: "md",
      color: "fg.muted",
      cursor: "pointer",
      outline: "none",
      border: "none",
      bg: "transparent",
      transitionProperty: "colors",
      transitionDuration: "fast",
      _hover: { color: "fg.default", bg: "bg.subtle" },
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "accent.default",
        outlineOffset: "2px",
      },
    },
  },
});

export default defineConfig({
  preflight: true,
  strictTokens: true,
  strictPropertyValues: true,
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  theme: {
    extend: {
      recipes: {
        button: buttonRecipe,
        badge: badgeRecipe,
        text: textRecipe,
      },
      slotRecipes: {
        card: cardSlotRecipe,
        dialog: dialogSlotRecipe,
      },
      tokens: {
        sizes: {
          full: { value: "100%" },
          screen: { value: "100vw" },
          "100vh": { value: "100vh" },
          "100dvh": { value: "100dvh" },
        },
        radii: {
          l1: { value: "0.25rem" },
          l2: { value: "0.5rem" },
          l3: { value: "0.75rem" },
        },
        zIndex: {
          overlay: { value: "1000" },
          modal: { value: "1100" },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            canvas: {
              value: {
                base: "{colors.slate.50}",
                _dark: "{colors.slate.950}",
              },
            },
            default: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.slate.900}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.100}",
                _dark: "{colors.slate.800}",
              },
            },
            muted: {
              value: {
                base: "{colors.slate.200}",
                _dark: "{colors.slate.700}",
              },
            },
          },
          fg: {
            default: {
              value: {
                base: "{colors.slate.900}",
                _dark: "{colors.slate.100}",
              },
            },
            muted: {
              value: {
                base: "{colors.slate.600}",
                _dark: "{colors.slate.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.400}",
                _dark: "{colors.slate.500}",
              },
            },
          },
          border: {
            default: {
              value: {
                base: "{colors.slate.300}",
                _dark: "{colors.slate.700}",
              },
            },
            subtle: {
              value: {
                base: "{colors.slate.200}",
                _dark: "{colors.slate.800}",
              },
            },
          },
          accent: {
            default: {
              value: {
                base: "{colors.slate.900}",
                _dark: "{colors.slate.100}",
              },
            },
            emphasized: {
              value: {
                base: "{colors.slate.800}",
                _dark: "{colors.slate.200}",
              },
            },
            fg: {
              value: {
                base: "{colors.white}",
                _dark: "{colors.slate.950}",
              },
            },
          },
          danger: {
            default: {
              value: {
                base: "{colors.red.600}",
                _dark: "{colors.red.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.red.50}",
                _dark: "rgba(239, 68, 68, 0.12)",
              },
            },
            border: {
              value: {
                base: "{colors.red.200}",
                _dark: "rgba(239, 68, 68, 0.35)",
              },
            },
            fg: {
              value: {
                base: "{colors.red.700}",
                _dark: "{colors.red.300}",
              },
            },
          },
          success: {
            default: {
              value: {
                base: "{colors.emerald.600}",
                _dark: "{colors.emerald.400}",
              },
            },
            subtle: {
              value: {
                base: "{colors.emerald.50}",
                _dark: "rgba(16, 185, 129, 0.12)",
              },
            },
            border: {
              value: {
                base: "{colors.emerald.200}",
                _dark: "rgba(16, 185, 129, 0.35)",
              },
            },
            fg: {
              value: {
                base: "{colors.emerald.700}",
                _dark: "{colors.emerald.300}",
              },
            },
          },
        },
      },
    },
  },
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  jsxFramework: "solid",
  outdir: "styled-system",
});
