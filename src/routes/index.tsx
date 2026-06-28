import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Pronto para começar</h1>
        <p className="text-muted-foreground">Envie o próximo prompt para criar seu novo site.</p>
      </div>
    </main>
  );
}
