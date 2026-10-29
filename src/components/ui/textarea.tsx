import type { ComponentProps } from "solid-js";
import { omit } from "solid-js";
import { cva, cx } from "styled-system/css";

export const textareaStyles = cva({
  base: {
    display: "flex",
    w: "full",
    borderRadius: "md",
    borderWidth: "1px",
    borderColor: "border.default",
    bg: "bg.default",
    px: "3",
    py: "2",
    color: "fg.default",
    outline: "none",
    minH: "20",
    transitionProperty: "colors",
    transitionDuration: "fast",
    _focus: {
      borderColor: "accent.default",
      outlineWidth: "1px",
      outlineStyle: "solid",
      outlineColor: "accent.default",
    },
    _disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      bg: "bg.subtle",
    },
    _placeholder: {
      color: "fg.muted",
    },
  },
  variants: {
    size: {
      sm: { textStyle: "xs", p: "2" },
      md: { textStyle: "sm", p: "3" },
      lg: { textStyle: "md", p: "4" },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface TextareaProps extends ComponentProps<"textarea"> {
  size?: "sm" | "md" | "lg";
}

/**
 * Universal Textarea Primitive
 * Uses Panda CSS cva styling with Solid 2.0 reactivity.
 */
export const Textarea = (props: TextareaProps) => {
  const rest = omit(props, "size", "class");
  return (
    <textarea
      {...rest}
      class={cx(
        textareaStyles({
          size: props.size,
        }),
        props.class as string,
      )}
    />
  );
};
