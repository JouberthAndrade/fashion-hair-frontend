import { useEffect, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use a destructive style for the confirm button (red). */
  destructive?: boolean;
}

export interface ConfirmDialogHostProps extends ConfirmOptions {
  onResolve: (value: boolean) => void;
}

/**
 * Renders the dialog. Mount/unmount is controlled by `open` so Radix can run
 * its exit animation; we resolve the host's promise on confirm/cancel.
 */
export function ConfirmDialogHost({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  onResolve,
}: ConfirmDialogHostProps) {
  const [open, setOpen] = useState(true);
  const decided = useRef(false);

  useEffect(() => {
    // Defensive: if the dialog is closed via overlay click / esc, treat as cancel.
    if (!open && !decided.current) {
      decided.current = true;
      onResolve(false);
    }
  }, [open, onResolve]);

  const decide = (value: boolean) => {
    if (decided.current) return;
    decided.current = true;
    onResolve(value);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => decide(false)}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => decide(true)}
            className={cn(destructive && buttonVariants({ variant: 'destructive' }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
