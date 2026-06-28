import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Pronto para começar</h1>
        <p className="text-muted-foreground">Envie o próximo prompt.</p>
      </div>
    </main>
  );
}
