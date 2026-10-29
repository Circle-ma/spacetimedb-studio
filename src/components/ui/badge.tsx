import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { type BadgeVariant, badge } from "styled-system/recipes";

export interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant["variant"];
  size?: BadgeVariant["size"];
}

/**
 * Badge Primitive
 * Encapsulates the Panda CSS badge recipe with Solid 2.0 fine-grained reactivity.
 * Strictly bounded by design tokens.
 */
export const Badge: ParentComponent<BadgeProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  return (
    <span
      {...rest}
      class={cx(
        badge({
          variant: props.variant,
          size: props.size,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </span>
  );
};
