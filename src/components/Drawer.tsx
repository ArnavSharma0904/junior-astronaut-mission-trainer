import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Side drawer built on the native <dialog>: showModal() gives a real focus trap, makes the page behind inert
 * and closes on Escape. Focus returns to the control that opened it.
 */
export function Drawer({ open, title, onClose, children, id }: { open: boolean; title: string; onClose: () => void; children: ReactNode; id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      id={id}
      className="drawer"
      aria-labelledby={`${id}-title`}
      onClose={() => {
        onClose();
        opener.current?.focus();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className="drawer-body">
        <header className="drawer-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button type="button" className="button button-quiet" onClick={() => dialog.current?.close()}>
            <Icon name="close" />
            <span>Close</span>
          </button>
        </header>
        {open ? children : null}
      </div>
    </dialog>
  );
}
