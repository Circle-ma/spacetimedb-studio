import { Dynamic } from "@solidjs/web";
import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { css, cx } from "styled-system/css";
import { type TextVariant, text } from "styled-system/recipes";
import type { SystemProperties } from "styled-system/types/system";
import type { ColorToken } from "./tokens";

export interface HeadingProps extends ComponentProps<"h2"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: TextVariant["size"];
  letterSpacing?: SystemProperties["letterSpacing"];
  fontWeight?: SystemProperties["fontWeight"];
  color?: ColorToken;
}

export const Heading: ParentComponent<HeadingProps> = (props) => {
  const rest = omit(
    props,
    "as",
    "size",
    "letterSpacing",
    "fontWeight",
    "color",
    "class",
    "children",
  );
  return (
    <Dynamic
      component={props.as ?? "h2"}
      {...rest}
      class={cx(
        text({
          variant: "heading",
          size: props.size ?? "xl",
        }),
        css({
          letterSpacing: props.letterSpacing,
          fontWeight: props.fontWeight,
          color: props.color,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface TextProps extends ComponentProps<"p"> {
  as?: "p" | "span" | "label" | "div";
  size?: TextVariant["size"];
  color?: ColorToken;
  fontWeight?: SystemProperties["fontWeight"];
  lineHeight?: SystemProperties["lineHeight"];
}

export const Text: ParentComponent<TextProps> = (props) => {
  const rest = omit(props, "as", "size", "color", "fontWeight", "lineHeight", "class", "children");
  return (
    <Dynamic
      component={props.as ?? "p"}
      {...rest}
      class={cx(
        text({
          variant: "body",
          size: props.size ?? "md",
        }),
        css({
          color: props.color,
          fontWeight: props.fontWeight,
          lineHeight: props.lineHeight,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </Dynamic>
  );
};

export interface CodeProps extends ComponentProps<"code"> {
  size?: TextVariant["size"];
  color?: ColorToken;
}

export const Code: ParentComponent<CodeProps> = (props) => {
  const rest = omit(props, "size", "color", "class", "children");
  return (
    <code
      {...rest}
      class={cx(
        text({
          variant: "code",
          size: props.size ?? "sm",
        }),
        props.color ? css({ color: props.color }) : undefined,
        props.class as string,
      )}
    >
      {props.children}
    </code>
  );
};
