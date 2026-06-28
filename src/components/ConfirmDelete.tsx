import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  title: string;
  description: React.ReactNode;
  /** Extra critical warning block (red) — e.g. open debt notice. */
  criticalWarning?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  /** When provided, replaces the default red trash icon trigger. */
  trigger?: React.ReactNode;
  triggerAriaLabel?: string;
  triggerTitle?: string;
};

export function ConfirmDelete({
  title,
  description,
  criticalWarning,
  confirmLabel = "Remover definitivamente",
  onConfirm,
  trigger,
  triggerAriaLabel = "Remover",
  triggerTitle = "Remover registro",
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={triggerAriaLabel}
            title={triggerTitle}
            className="w-8 h-8 grid place-items-center rounded-md border border-border bg-secondary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-primary/15 text-primary">
              <Trash2 className="w-4 h-4" />
            </span>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {criticalWarning && (
          <div className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary">
            {criticalWarning}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}