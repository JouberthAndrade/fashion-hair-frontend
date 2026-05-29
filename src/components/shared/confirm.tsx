import { createRoot, type Root } from 'react-dom/client';
import { ConfirmDialogHost, type ConfirmOptions } from './ConfirmDialog';

export type { ConfirmOptions };

/**
 * Imperative API that mirrors `window.confirm()` but returns a Promise<boolean>
 * and renders a Radix-based, accessible dialog. Designed to be a drop-in
 * replacement for `if (confirm('...'))` chains in event handlers.
 *
 * Usage:
 *   if (await confirm({ title: 'Remover cliente?', destructive: true })) { ... }
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.dataset.confirmDialogHost = 'true';
    document.body.appendChild(container);
    let root: Root | null = createRoot(container);

    const cleanup = () => {
      // Defer unmount past the Radix close animation tick.
      queueMicrotask(() => {
        if (root) {
          root.unmount();
          root = null;
        }
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    };

    const onResolve = (value: boolean) => {
      resolve(value);
      cleanup();
    };

    root.render(<ConfirmDialogHost {...options} onResolve={onResolve} />);
  });
}
