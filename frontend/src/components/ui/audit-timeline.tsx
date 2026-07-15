export type AuditEvent = {
  id: string | number;
  actorName: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string | null;
  occurredAt: string;
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-500">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 border-l-2 border-border pl-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">
              <span className="font-semibold text-ink-900">{event.actorName}</span>{" "}
              <span className="text-ink-500">{event.action}</span>
              {event.fromValue && event.toValue && (
                <span className="text-ink-500">
                  {" "}
                  ({event.fromValue} → {event.toValue})
                </span>
              )}
            </span>
            {event.note && <p className="text-sm text-ink-500">{event.note}</p>}
            <time className="text-xs text-ink-400">
              {new Date(event.occurredAt).toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
