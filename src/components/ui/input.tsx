import type { ComponentProps } from "solid-js";
import { omit } from "solid-js";
import { cva, cx } from "styled-system/css";

export const inputStyles = cva({
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
      sm: { h: "8", textStyle: "xs", px: "2.5" },
      md: { h: "9", textStyle: "sm", px: "3" },
      lg: { h: "10", textStyle: "md", px: "3.5" },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface InputProps extends ComponentProps<"input"> {
  size?: "sm" | "md" | "lg";
}

/**
 * Universal Input Primitive
 * Uses Panda CSS cva styling with Solid 2.0 reactivity.
 */
export const Input = (props: InputProps) => {
  const rest = omit(props, "size", "class");
  return (
    <input
      {...rest}
      class={cx(
        inputStyles({
          size: props.size,
        }),
        props.class as string,
      )}
    />
  );
};
