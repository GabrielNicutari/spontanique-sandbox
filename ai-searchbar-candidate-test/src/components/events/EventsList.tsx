import React from 'react';
import { EventCard } from './EventCard';
import { EventWithTickets } from '@/types/event';

interface EventsListProps {
  events: EventWithTickets[];
}

export const EventsList: React.FC<EventsListProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search query</p>
      </div>
    );
  }

  // Separate events by tier if they have tier information
  const tier1Events = events.filter(e => (e as any)._tier === 1);
  const tier2Events = events.filter(e => (e as any)._tier === 2);

  // If no tiering, show all events normally
  const hasTiering = tier1Events.length > 0 || tier2Events.length > 0;

  if (!hasTiering) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Show message if only low-scoring results */}
      {tier1Events.length === 0 && tier2Events.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No highly relevant results found. Showing {tier2Events.length} possible match{tier2Events.length !== 1 ? 'es' : ''} that may be of interest:
          </p>
        </div>
      )}

      {/* Tier 1: Highly Relevant */}
      {tier1Events.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {tier1Events.length} Highly Relevant {tier1Events.length !== 1 ? 'Results' : 'Result'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tier1Events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Separator and Tier 2 heading (only if there are Tier 1 results too) */}
      {tier1Events.length > 0 && tier2Events.length > 0 && (
        <>
          <div className="space-y-4">
            <div className="border-t border-border my-6" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-muted-foreground">
                You might also be interested in... ({tier2Events.length} {tier2Events.length !== 1 ? 'results' : 'result'})
              </h3>
              <p className="text-sm text-muted-foreground">These events do not match your search directly but may still be of interest</p>
            </div>
          </div>
        </>
      )}

      {/* Tier 2: Possibly Relevant */}
      {tier2Events.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${tier1Events.length > 0 ? 'opacity-75' : ''}`}>
          {tier2Events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
