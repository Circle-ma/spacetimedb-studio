import { Dialog as ArkDialog, useDialogContext } from "@ark-ui/solid/dialog";
import { Portal as SolidPortal } from "@solidjs/web";
import type { ComponentProps, ParentComponent } from "solid-js";
import { omit, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import { type ButtonVariant, button, dialog } from "styled-system/recipes";

export const DialogRoot = ArkDialog.Root;

export interface DialogTriggerProps extends ComponentProps<typeof ArkDialog.Trigger> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

export const DialogTrigger: ParentComponent<DialogTriggerProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  return (
    <ArkDialog.Trigger
      {...rest}
      class={cx(
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : undefined,
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Trigger>
  );
};

export const DialogBackdrop: ParentComponent<ComponentProps<typeof ArkDialog.Backdrop>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Backdrop {...rest} class={cx(styles.backdrop, props.class as string)}>
      {props.children}
    </ArkDialog.Backdrop>
  );
};

export const DialogPositioner: ParentComponent<ComponentProps<typeof ArkDialog.Positioner>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Positioner {...rest} class={cx(styles.positioner, props.class as string)}>
      {props.children}
    </ArkDialog.Positioner>
  );
};

export const DialogContent: ParentComponent<ComponentProps<typeof ArkDialog.Content>> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Content {...rest} class={cx(styles.content, props.class as string)}>
      {props.children}
    </ArkDialog.Content>
  );
};

export interface DialogCloseTriggerProps extends ComponentProps<typeof ArkDialog.CloseTrigger> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

export const DialogCloseTrigger: ParentComponent<DialogCloseTriggerProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  const styles = dialog();

  return (
    <ArkDialog.CloseTrigger
      {...rest}
      class={cx(
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : styles.closeTrigger,
        props.class as string,
      )}
    >
      {props.asChild
        ? undefined
        : (props.children ?? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M11.78 3.22a.75.75 0 0 0-1.06 0L7.5 6.44 4.28 3.22a.75.75 0 0 0-1.06 1.06L8.56 7.5l3.22-3.22a.75.75 0 0 0 0-1.06Z" />
            </svg>
          ))}
    </ArkDialog.CloseTrigger>
  );
};

export const DialogHeader: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "column",
          gap: "1.5",
          w: "full",
          pr: "8",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export const DialogTitle: ParentComponent<ComponentProps<typeof ArkDialog.Title>> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Title {...rest} class={cx(styles.title, props.class as string)}>
      {props.children}
    </ArkDialog.Title>
  );
};

export const DialogDescription: ParentComponent<ComponentProps<typeof ArkDialog.Description>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Description {...rest} class={cx(styles.description, props.class as string)}>
      {props.children}
    </ArkDialog.Description>
  );
};

export const DialogBody: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "column",
          gap: "4",
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export const DialogFooter: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "3",
          w: "full",
          pt: "2",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

export type DialogPortalProps = ComponentProps<typeof SolidPortal>;

export const DialogPortal: ParentComponent<DialogPortalProps> = (props) => {
  const dialogContext = useDialogContext();
  return (
    <Show when={dialogContext().open}>
      <SolidPortal {...props}>{props.children}</SolidPortal>
    </Show>
  );
};

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Positioner: DialogPositioner,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  CloseTrigger: DialogCloseTrigger,
};

export default Dialog;
