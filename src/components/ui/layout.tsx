import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { box, container, divider, grid, hstack, vstack } from "styled-system/patterns";
import type { SystemProperties } from "styled-system/types/system";
import type { ColorToken } from "./tokens";

export interface BoxProps extends ComponentProps<"div"> {
  minH?: SystemProperties["minHeight"];
  minW?: SystemProperties["minWidth"];
  w?: SystemProperties["width"];
  h?: SystemProperties["height"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  borderRadius?: SystemProperties["borderRadius"];
}

export const Box: ParentComponent<BoxProps> = (props) => {
  const rest = omit(
    props,
    "minH",
    "minW",
    "w",
    "h",
    "bg",
    "color",
    "p",
    "px",
    "py",
    "borderRadius",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        box({
          minH: props.minH,
          minW: props.minW,
          w: props.w,
          h: props.h,
          bg: props.bg,
          color: props.color,
          p: props.p,
          px: props.px,
          py: props.py,
          borderRadius: props.borderRadius,
          boxSizing: "border-box",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface ContainerProps extends ComponentProps<"div"> {
  maxW?: SystemProperties["maxWidth"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
}

export const Container: ParentComponent<ContainerProps> = (props) => {
  const rest = omit(props, "maxW", "p", "px", "py", "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        container({
          maxW: props.maxW,
          p: props.p,
          px: props.px,
          py: props.py,
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface VStackProps extends ComponentProps<"div"> {
  gap?: SystemProperties["gap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  h?: SystemProperties["height"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  overflowY?: SystemProperties["overflowY"];
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: SystemProperties["borderColor"];
  borderRadius?: SystemProperties["borderRadius"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
}

export const VStack: ParentComponent<VStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "minH",
    "maxH",
    "h",
    "minW",
    "maxW",
    "w",
    "overflowY",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "p",
    "px",
    "py",
    "bg",
    "color",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        vstack({
          gap: props.gap ?? "4",
          alignItems: props.alignItems ?? "stretch",
          justify: props.justifyContent,
          minH: props.minH,
          maxH: props.maxH,
          h: props.h,
          minW: props.minW,
          maxW: props.maxW,
          w: props.w,
          overflowY: props.overflowY,
          borderWidth: props.borderWidth,
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          borderRadius: props.borderRadius,
          p: props.p,
          px: props.px,
          py: props.py,
          bg: props.bg,
          color: props.color,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface HStackProps extends ComponentProps<"div"> {
  gap?: SystemProperties["gap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  minH?: SystemProperties["minHeight"];
  maxH?: SystemProperties["maxHeight"];
  h?: SystemProperties["height"];
  minW?: SystemProperties["minWidth"];
  maxW?: SystemProperties["maxWidth"];
  w?: SystemProperties["width"];
  borderWidth?: SystemProperties["borderWidth"];
  borderStyle?: SystemProperties["borderStyle"];
  borderColor?: SystemProperties["borderColor"];
  borderRadius?: SystemProperties["borderRadius"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
  bg?: SystemProperties["backgroundColor"];
  color?: SystemProperties["color"];
}

export const HStack: ParentComponent<HStackProps> = (props) => {
  const rest = omit(
    props,
    "gap",
    "alignItems",
    "justifyContent",
    "minH",
    "maxH",
    "h",
    "minW",
    "maxW",
    "w",
    "borderWidth",
    "borderStyle",
    "borderColor",
    "borderRadius",
    "p",
    "px",
    "py",
    "bg",
    "color",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        hstack({
          gap: props.gap ?? "3",
          alignItems: props.alignItems ?? "center",
          justify: props.justifyContent,
          minH: props.minH,
          maxH: props.maxH,
          h: props.h,
          minW: props.minW,
          maxW: props.maxW,
          w: props.w,
          borderWidth: props.borderWidth,
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          borderRadius: props.borderRadius,
          p: props.p,
          px: props.px,
          py: props.py,
          bg: props.bg,
          color: props.color,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface GridProps extends ComponentProps<"div"> {
  columns?: number;
  gap?: SystemProperties["gap"];
  rowGap?: SystemProperties["rowGap"];
  columnGap?: SystemProperties["columnGap"];
  alignItems?: SystemProperties["alignItems"];
  justifyContent?: SystemProperties["justifyContent"];
  w?: SystemProperties["width"];
  minH?: SystemProperties["minHeight"];
  p?: SystemProperties["padding"];
  px?: SystemProperties["paddingInline"];
  py?: SystemProperties["paddingBlock"];
}

export const Grid: ParentComponent<GridProps> = (props) => {
  const rest = omit(
    props,
    "columns",
    "gap",
    "rowGap",
    "columnGap",
    "alignItems",
    "justifyContent",
    "w",
    "minH",
    "p",
    "px",
    "py",
    "class",
    "children",
  );
  return (
    <div
      {...rest}
      class={cx(
        grid({
          columns: props.columns ?? 1,
          gap: props.gap ?? "6",
          rowGap: props.rowGap,
          columnGap: props.columnGap,
          alignItems: props.alignItems,
          justifyContent: props.justifyContent,
          w: props.w ?? "full",
          minH: props.minH,
          p: props.p,
          px: props.px,
          py: props.py,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export interface DividerProps extends ComponentProps<"hr"> {
  orientation?: "horizontal" | "vertical";
  thickness?: SystemProperties["borderWidth"];
  color?: ColorToken;
  borderColor?: ColorToken;
}

export const Divider: ParentComponent<DividerProps> = (props) => {
  const rest = omit(props, "orientation", "thickness", "color", "borderColor", "class", "children");
  return (
    <hr
      {...rest}
      class={cx(
        divider({
          orientation: props.orientation ?? "horizontal",
          thickness: props.thickness ?? "1px",
          color: props.borderColor ?? props.color ?? "border.subtle",
        }),
        props.class as string,
      )}
    />
  );
};
