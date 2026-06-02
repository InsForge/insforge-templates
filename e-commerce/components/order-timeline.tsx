import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { OrderStatusEvent, OrderStatusEventType } from '@/lib/types';

const STEPS: { type: OrderStatusEventType; label: string }[] = [
  { type: 'order_placed', label: 'Order placed' },
  { type: 'payment_succeeded', label: 'Payment confirmed' },
  { type: 'fulfillment_processing', label: 'Preparing' },
  { type: 'fulfillment_shipped', label: 'Shipped' },
  { type: 'fulfillment_delivered', label: 'Delivered' },
];

export function OrderTimeline({ events }: { events: OrderStatusEvent[] }) {
  const reached = new Set(events.map((e) => e.event_type));
  const eventByType = new Map(events.map((e) => [e.event_type, e]));

  const firstUnreachedIndex = STEPS.findIndex((s) => !reached.has(s.type));

  return (
    <ol className="space-y-4">
      {STEPS.map((step, index) => {
        const event = eventByType.get(step.type);
        const isDone = reached.has(step.type);
        const isCurrent = !isDone && index === firstUnreachedIndex;

        return (
          <li key={step.type} className="flex items-start gap-3" aria-current={isCurrent ? 'step' : undefined}>
            <span className="mt-0.5">
              {isDone ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : isCurrent ? (
                <Clock className="size-5 text-foreground" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </span>
            <div className="text-sm">
              <p className={isDone ? 'font-medium' : 'text-muted-foreground'}>
                {step.label}
              </p>
              {event ? (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), 'MMM d, yyyy · h:mm a')}
                  {event.message ? `, ${event.message}` : ''}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
