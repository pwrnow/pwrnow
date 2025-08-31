export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string | null;
  duration: string;
  endTime: string;
}

export const generateScheduleData = (
  eventDays: any[]
): Record<string, ScheduleItem[]> => {
  if (!eventDays || eventDays.length === 0) return {};

  const scheduleData: Record<string, ScheduleItem[]> = {};

  eventDays.forEach((day, index) => {
    if (index === 0) {
      // First day
      scheduleData[day.id] = [
        {
          id: 'day1-1',
          time: '09:00',
          title: 'Rejestracja uczestników',
          description: 'Odbiór identyfikatorów i materiałów konferencyjnych',
          speaker: null,
          duration: '60 min',
          endTime: '10:00',
        },
        {
          id: 'day1-2',
          time: '10:00',
          title: 'Ceremonia otwarcia',
          description: 'Uroczyste otwarcie wydarzenia i powitanie uczestników',
          speaker: 'Prof. Jan Kowalski',
          duration: '30 min',
          endTime: '10:30',
        },
        {
          id: 'day1-3',
          time: '10:30',
          title: 'Keynote: Digitalna transformacja',
          description:
            'Jak technologia zmienia nasze życie zawodowe i prywatne',
          speaker: 'Dr Anna Nowak',
          duration: '45 min',
          endTime: '11:15',
        },
        {
          id: 'day1-4',
          time: '11:15',
          title: 'Przerwa kawowa',
          description: 'Networking i refreshment w holu głównym',
          speaker: null,
          duration: '15 min',
          endTime: '11:30',
        },
        {
          id: 'day1-5',
          time: '11:30',
          title: 'Panel: Przyszłość pracy',
          description: 'Dyskusja o remote work i nowych formach zatrudnienia',
          speaker: 'Panel ekspertów HR',
          duration: '60 min',
          endTime: '12:30',
        },
        {
          id: 'day1-6',
          time: '12:30',
          title: 'Lunch break',
          description: 'Wspólny obiad i networking',
          speaker: null,
          duration: '90 min',
          endTime: '14:00',
        },
        {
          id: 'day1-7',
          time: '14:00',
          title: 'Warsztaty: Design Thinking',
          description: 'Praktyczne zastosowanie metodyki design thinking',
          speaker: 'Maria Kowalczyk',
          duration: '120 min',
          endTime: '16:00',
        },
        {
          id: 'day1-8',
          time: '16:00',
          title: 'Networking session',
          description: 'Nieformalne rozmowy i wymiana kontaktów',
          speaker: null,
          duration: '60 min',
          endTime: '17:00',
        },
      ];
    } else if (index === 1) {
      // Second day
      scheduleData[day.id] = [
        {
          id: 'day2-1',
          time: '09:00',
          title: 'Porannja kawa',
          description: 'Rozpoczęcie drugiego dnia z kawą i croissantami',
          speaker: null,
          duration: '30 min',
          endTime: '09:30',
        },
        {
          id: 'day2-2',
          time: '09:30',
          title: 'Keynote: AI w biznesie',
          description: 'Praktyczne zastosowania sztucznej inteligencji',
          speaker: 'Dr Piotr Wiśniewski',
          duration: '45 min',
          endTime: '10:15',
        },
        {
          id: 'day2-3',
          time: '10:15',
          title: 'Przerwa',
          description: 'Krótka przerwa na rozciągnięcie',
          speaker: null,
          duration: '15 min',
          endTime: '10:30',
        },
        {
          id: 'day2-4',
          time: '10:30',
          title: 'Warsztaty: Machine Learning',
          description: 'Wprowadzenie do algorytmów uczenia maszynowego',
          speaker: 'Zespół Data Science',
          duration: '90 min',
          endTime: '12:00',
        },
        {
          id: 'day2-5',
          time: '12:00',
          title: 'Panel: Startup ecosystem',
          description: 'Dyskusja o ekosystemie startupowym w Polsce',
          speaker: 'Założyciele startupów',
          duration: '60 min',
          endTime: '13:00',
        },
        {
          id: 'day2-6',
          time: '13:00',
          title: 'Lunch break',
          description: 'Wspólny posiłek w restauracji hotelowej',
          speaker: null,
          duration: '60 min',
          endTime: '14:00',
        },
        {
          id: 'day2-7',
          time: '14:00',
          title: 'Tech talk: DevOps',
          description: 'Automatyzacja procesów i best practices',
          speaker: 'Michał Kowalski',
          duration: '45 min',
          endTime: '14:45',
        },
        {
          id: 'day2-8',
          time: '14:45',
          title: 'Q&A Session',
          description: 'Pytania i odpowiedzi z wszystkimi prelegentami',
          speaker: 'Wszyscy prelegenci',
          duration: '30 min',
          endTime: '15:15',
        },
        {
          id: 'day2-9',
          time: '15:15',
          title: 'Ceremonia zamknięcia',
          description: 'Podsumowanie wydarzenia i plany na przyszłość',
          speaker: 'Organizatorzy',
          duration: '30 min',
          endTime: '15:45',
        },
      ];
    } else {
      // Third day and beyond
      scheduleData[day.id] = [
        {
          id: `day${index + 1}-1`,
          time: '09:00',
          title: 'Śniadanie networkingowe',
          description: 'Rozpoczęcie ostatniego dnia z networking breakfast',
          speaker: null,
          duration: '60 min',
          endTime: '10:00',
        },
        {
          id: `day${index + 1}-2`,
          time: '10:00',
          title: 'Keynote: Zrównoważony rozwój',
          description: 'Technologia w służbie zrównoważonego rozwoju',
          speaker: 'Prof. Barbara Zielińska',
          duration: '45 min',
          endTime: '10:45',
        },
        {
          id: `day${index + 1}-3`,
          time: '10:45',
          title: 'Przerwa kawowa',
          description: 'Ostatnia przerwa kawowa wydarzenia',
          speaker: null,
          duration: '15 min',
          endTime: '11:00',
        },
        {
          id: `day${index + 1}-4`,
          time: '11:00',
          title: 'Warsztaty: Liderstwo',
          description: 'Rozwój umiejętności przywódczych w zespole',
          speaker: 'Katarzyna Nowak',
          duration: '90 min',
          endTime: '12:30',
        },
        {
          id: `day${index + 1}-5`,
          time: '12:30',
          title: 'Panel podsumowujący',
          description: 'Podsumowanie trzech dni konferencji',
          speaker: 'Główni prelegenci',
          duration: '60 min',
          endTime: '13:30',
        },
        {
          id: `day${index + 1}-6`,
          time: '13:30',
          title: 'Lunch pożegnalny',
          description: 'Ostatni wspólny posiłek i pożegnania',
          speaker: null,
          duration: '90 min',
          endTime: '15:00',
        },
        {
          id: `day${index + 1}-7`,
          time: '15:00',
          title: 'Zakończenie wydarzenia',
          description: 'Oficjalne zakończenie i dziękczynienie',
          speaker: 'Dyrektor konferencji',
          duration: '15 min',
          endTime: '15:15',
        },
      ];
    }
  });

  return scheduleData;
};
