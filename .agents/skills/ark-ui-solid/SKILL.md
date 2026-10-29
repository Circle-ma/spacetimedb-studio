---

name: ark-ui-solid
description: Guide for building accessible UI components with Ark UI Solid (@ark-ui/solid) and Panda CSS 2.4 slot recipes in Solid.js 2.0. Read when building or refactoring UI components, dialogs, menus, selects, or forms.
---

# Ark UI Solid & Panda CSS 2.4 Best Practices

Ark UI provides headless, accessible component primitives powered by Zag.js state machines.
This starter pairs Ark UI with native Panda CSS 2.4 design tokens and slot recipes defined in `panda.config.ts`.

## 1. Golden Rules for Ark UI Solid

### Rule 1: Autonomous Lifecycle via Encapsulated `<Dialog.Portal>`

In this framework, `<Dialog.Portal>` internally binds to Ark UI's `useDialogContext()` and `<Show when={dialog().open}>`:
```tsx
<Dialog.Root lazyMount unmountOnExit>
  <Dialog.Trigger variant="outline">Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.CloseTrigger />
        <Dialog.Header>
          <Dialog.Title>Dialog Header</Dialog.Title>
          <Dialog.Description>Dialog subtitle context</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>Dialog Content Details</Dialog.Body>
        <Dialog.Footer>
          <Dialog.CloseTrigger variant="outline" size="sm">
            Cancel
          </Dialog.CloseTrigger>
          <Dialog.CloseTrigger variant="solid" size="sm">
            Confirm
          </Dialog.CloseTrigger>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Portal>
</Dialog.Root>;
```
_Why?_ Zag.js handles the state machine (ESC keys, focus restoration, ARIA attributes), while `<Dialog.Portal>` ensures total DOM removal upon closing without requiring manual `const [isOpen, setIsOpen]` signal boilerplate.

### Rule 2: DO NOT Use `asChild` as a Boolean Flag

In React / Radix libraries, `asChild` is commonly used as a boolean flag:
```tsx
// ❌ WRONG (React pattern - will crash in Ark UI Solid with TypeError: localProps.asChild is not a function)
<Dialog.Trigger asChild>
  <button type="button">Open</button>
</Dialog.Trigger>;
```

In **Ark UI Solid**, Ark components are already polymorphic DOM elements (`ark.button`, `ark.div`, etc.).
In our framework, style triggers typesafely with encapsulated variants or `<Button>`:
```tsx
// ✅ RIGHT: Direct typesafe variants on framework primitives
<Dialog.Trigger variant="outline">Open Dialog</Dialog.Trigger>;
```

If you truly need custom rendering, `asChild` in Solid expects a **Render Prop function**:
```tsx
// ✅ RIGHT (if using asChild, pass a function)
<Dialog.Trigger
  asChild={(props) => (
    <Button variant="outline" {...props()}>
      Custom Button
    </Button>
  )}
/>;
```

### Rule 3: Import `<Portal>` from `@solidjs/web`

In Solid 2.0, DOM utilities and `<Portal>` reside in `@solidjs/web`:
```tsx
import { Portal } from "@solidjs/web";
```

### Rule 4: Use Controlled and Uncontrolled Modals Idiomatically

Ark UI components are self-managing by default via Zag.js state machines.
```tsx
// Uncontrolled (recommended when external state sync is not required):
<Dialog.Root defaultOpen={false}>
  <Dialog.Trigger variant="solid">Open</Dialog.Trigger>
  ...
</Dialog.Root>;

// Controlled (when synced to an external Solid signal):
const [open, setOpen] = createSignal(false);

<Dialog.Root open={open()} onOpenChange={(e) => setOpen(e.open)}>
  <Dialog.Trigger variant="solid">Open</Dialog.Trigger>
  ...
</Dialog.Root>;
```

## 2. Panda CSS 2.4 Slot Recipe Anatomy

Panda CSS 2.4 slot recipes generate typed slot classnames in `styled-system/recipes`.
For example, our pre-composed dialog primitive uses `dialog()` slot recipe:
```tsx
import { Dialog as ArkDialog } from "@ark-ui/solid/dialog";
import { Portal } from "@solidjs/web";
import { dialog, button } from "styled-system/recipes";

export function CustomDialog() {
  const styles = dialog();

  return (
    <ArkDialog.Root>
      <ArkDialog.Trigger class={button({ variant: "outline" })}>Open Dialog</ArkDialog.Trigger>

      <Portal>
        <ArkDialog.Backdrop class={styles.backdrop} />
        <ArkDialog.Positioner class={styles.positioner}>
          <ArkDialog.Content class={styles.content}>
            <ArkDialog.Title class={styles.title}>Dialog Title</ArkDialog.Title>
            <ArkDialog.Description class={styles.description}>
              Dialog body content goes here.
            </ArkDialog.Description>
            <ArkDialog.CloseTrigger class={styles.closeTrigger}>Close</ArkDialog.CloseTrigger>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}
```
