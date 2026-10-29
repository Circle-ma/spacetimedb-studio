import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { type ButtonVariant, button } from "styled-system/recipes";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

/**
 * Button Primitive
 * Encapsulates the Panda CSS button recipe with Solid 2.0 fine-grained reactivity.
 * Automatically defaults type to "button" to prevent unwanted form submit triggers.
 * Strictly bounded by design tokens.
 */
export const Button: ParentComponent<ButtonProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children", "type");
  return (
    <button
      type={props.type ?? "button"}
      {...rest}
      class={cx(
        button({
          variant: props.variant,
          size: props.size,
        }),
        props.class as string,
      )}
    >
      {props.children}
    </button>
  );
};
