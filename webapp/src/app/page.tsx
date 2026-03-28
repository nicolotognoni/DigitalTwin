import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Digital Twin
        </h1>
        <p className="text-lg text-muted-foreground">
          Trasforma le tue conversazioni con gli LLM in un agente AI personale.
          Il tuo Digital Twin conosce le tue competenze, preferenze e opinioni —
          e può interagire con i Twin dei tuoi amici.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}
