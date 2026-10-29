import type { ComponentProps, ParentComponent } from "solid-js";
import { omit } from "solid-js";
import { cx } from "styled-system/css";
import { card } from "styled-system/recipes";

/**
 * Root Card Container
 * Encapsulated container with pre-configured padding, borders, and elevation.
 */
export const CardRoot: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <div {...rest} class={cx(styles.root, props.class as string)}>
      {props.children}
    </div>
  );
};

/**
 * Card Header Layout Slot
 * Tight vertical stack pairing title and description.
 */
export const CardHeader: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <div {...rest} class={cx(styles.header, props.class as string)}>
      {props.children}
    </div>
  );
};

/**
 * Card Title Slot Component
 * High-contrast semantic heading.
 */
export const CardTitle: ParentComponent<ComponentProps<"h3">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <h3 {...rest} class={cx(styles.title, props.class as string)}>
      {props.children}
    </h3>
  );
};

/**
 * Card Description Slot Component
 * Muted explanatory text.
 */
export const CardDescription: ParentComponent<ComponentProps<"p">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <p {...rest} class={cx(styles.description, props.class as string)}>
      {props.children}
    </p>
  );
};

/**
 * Card Body Layout Slot
 * Systematic container for card contents with uniform vertical spacing.
 */
export const CardBody: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <div {...rest} class={cx(styles.body, props.class as string)}>
      {props.children}
    </div>
  );
};

/**
 * Card Footer Layout Slot
 * Action container with right-aligned button stack.
 */
export const CardFooter: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = card();
  return (
    <div {...rest} class={cx(styles.footer, props.class as string)}>
      {props.children}
    </div>
  );
};

export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
};

export default Card;
