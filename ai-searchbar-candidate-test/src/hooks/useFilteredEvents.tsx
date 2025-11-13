import { useMemo } from 'react';
import { EventWithTickets } from '@/types/event';

export const useFilteredEvents = (
  events: EventWithTickets[],
  category: string,
  priceRange: [number, number],
  dateFilter: string
) => {
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(event => event.category === category);
    }

    // Filter by price
    filtered = filtered.filter(
      event => event.price >= priceRange[0] && event.price <= priceRange[1]
    );

    // Filter by date
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        
        switch (dateFilter) {
          case 'today':
            return eventDate.toDateString() === now.toDateString();
          case 'tomorrow':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return eventDate.toDateString() === tomorrow.toDateString();
          case 'week':
            const weekFromNow = new Date(now);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return eventDate >= now && eventDate <= weekFromNow;
          case 'weekend':
            const day = eventDate.getDay();
            return (day === 0 || day === 6) && eventDate >= now;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [events, category, priceRange, dateFilter]);

  return { filteredEvents };
};
