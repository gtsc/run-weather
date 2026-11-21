import type { Attachment } from 'svelte/attachments';

/**
 * Light-dismiss fallback for `<dialog closedby="any">` in browsers without `closedby`
 * (Safari). Compares the pointer position to the dialog box rather than checking
 * `event.target`, because the dialog itself is also the target for clicks on its own
 * padding. Both press and release must be outside, so a text-selection drag that ends
 * on the backdrop doesn't close it.
 */
export const lightDismiss: Attachment<HTMLDialogElement> = (dialog) => {
  if ('closedBy' in HTMLDialogElement.prototype) return;

  const outside = (e: PointerEvent) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let pressedOutside = false;
  const onDown = (e: PointerEvent) => (pressedOutside = outside(e));
  const onUp = (e: PointerEvent) => {
    if (pressedOutside && outside(e)) dialog.close();
  };

  dialog.addEventListener('pointerdown', onDown);
  dialog.addEventListener('pointerup', onUp);
  return () => {
    dialog.removeEventListener('pointerdown', onDown);
    dialog.removeEventListener('pointerup', onUp);
  };
};
