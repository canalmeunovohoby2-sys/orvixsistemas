import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Pronto para começar</p>
    </main>
  );
}
