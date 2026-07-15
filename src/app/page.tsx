export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface-base px-6 text-center">
      <span className="rounded-pill border border-border bg-surface-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal">
        Sticks
      </span>
      <h1 className="text-3xl font-semibold text-ink-900">
        Internal <span className="text-gold-dark">Ticketing</span> System
      </h1>
      <p className="max-w-md text-ink-500">
        Project scaffolding is in place. Dashboard, Tickets, and Reports land
        in upcoming feature commits.
      </p>
    </div>
  );
}
