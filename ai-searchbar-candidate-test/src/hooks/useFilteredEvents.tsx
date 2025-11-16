import { useMemo } from 'react';
import { EventWithTickets } from '@/types/event';

export const useFilteredEvents = (
  events: EventWithTickets[],
  category: string,
  location: string,
  priceRange: [number, number],
  dateFilter: string,
  showOnlyPartnerEvents: boolean
) => {
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by category
    if (category && category !== 'All') {
      filtered = filtered.filter(event => event.category === category);
    }

    // Filter by location
    if (location && location.trim()) {
      const lowerLocation = location.toLowerCase();
      filtered = filtered.filter(event =>
        event.city.toLowerCase().includes(lowerLocation) ||
        event.venue.toLowerCase().includes(lowerLocation)
      );
    }

    // Filter by price
    filtered = filtered.filter(
      event => event.price >= priceRange[0] && event.price <= priceRange[1]
    );

    // Filter by date
    if (dateFilter && dateFilter !== '') {
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

    // Filter by partner events
    if (showOnlyPartnerEvents) {
      filtered = filtered.filter(event => event.source_type === 'native');
    }

    return filtered;
  }, [events, category, location, priceRange, dateFilter, showOnlyPartnerEvents]);

  return filteredEvents;
};
