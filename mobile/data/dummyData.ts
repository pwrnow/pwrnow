import { Event, Category, Organization } from '../types';

export const categories: Category[] = [
  { id: 'all', name: 'Wszystkie', slug: 'wszystkie' },
  { id: '1', name: 'Imprezy', slug: 'imprezy' },
  { id: '2', name: 'Kursy', slug: 'kursy' },
  { id: '3', name: 'Prelekcje', slug: 'prelekcje' },
  { id: '4', name: 'Rozwój', slug: 'rozwoj' },
  { id: '5', name: 'Sport', slug: 'sport' },
  { id: '6', name: 'Wyjazdy', slug: 'wyjazdy' },
];

export const organizations: Organization[] = [
  {
    id: '1',
    name: 'KN Mazuralia',
    image_url:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: '2',
    name: 'Samorząd Studentów PWr',
    image_url:
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: '3',
    name: 'KN Informatyków',
    image_url:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: '4',
    name: 'English Speaking Club',
    image_url:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: '5',
    name: 'PWr Racing Team',
    image_url:
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=100&fit=crop&crop=center',
  },
];

export const events: Event[] = [
  {
    id: '1',
    title: 'Mazuralia PWR 2025 - POKO Edition!',
    description: `Ahoj!
Zapraszamy Was na piątą już edycję wyśmienitej, studenckiej imprezy żeglarskiej Mazuralia PWR 2025 - POKO Edition! Tak jak w poprzednich dwóch latach, także i w tym przeszufranyi w przeszłymi nezyło.

Ta wyjątkowa impreza łączy w sobie sport, zabawę i niezapomniane wspomnienia. Będziemy mieli okazję popływać po mazurskich jeziorach, wziąć udział w regatach, a wieczorami bawić się przy ognisku.`,
    starts_at: '2025-07-19T15:00:00Z',
    ends_at: '2025-07-19T16:00:00Z',
    location: 'Wilkasy',
    image_url:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
    url: 'https://mazuralia.pwr.edu.pl',
    verified: true,
    organization: organizations[0],
    category: categories[1], // Imprezy
  },
  {
    id: '2',
    title: 'Warsztaty React Native - Tworzenie aplikacji mobilnych',
    description: `Poznaj podstawy tworzenia aplikacji mobilnych z React Native!

W trakcie warsztatów nauczysz się:
• Podstaw React Native i Expo
• Tworzenia komponentów
• Nawigacji między ekranami
• Integracji z API
• Publikacji aplikacji

Warsztat skierowany do studentów z podstawową znajomością JavaScript i React.`,
    starts_at: '2025-02-15T14:00:00Z',
    ends_at: '2025-02-15T18:00:00Z',
    location: 'Budynek C-13, sala 1.01',
    image_url:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
    url: 'https://kn-informatykow.pl',
    verified: true,
    organization: organizations[2],
    category: categories[2], // Kursy
  },
  {
    id: '3',
    title: 'Konferencja AI & Machine Learning 2025',
    description: `Największa konferencja AI na Politechnice Wrocławskiej!

Agenda:
• Keynote: "Przyszłość AI w przemyśle" - Prof. Jan Kowalski
• Panel dyskusyjny: "Etyka w AI"
• Warsztat: "Wprowadzenie do TensorFlow"
• Networking session z pracodawcami

Wydarzenie dla studentów, doktorantów i pracowników naukowych zainteresowanych sztuczną inteligencją.`,
    starts_at: '2025-03-20T09:00:00Z',
    ends_at: '2025-03-20T17:00:00Z',
    location: 'Aula Główna PWr',
    image_url:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    url: 'https://ai-conference.pwr.edu.pl',
    verified: true,
    organization: organizations[1],
    category: categories[3], // Prelekcje
  },
  {
    id: '4',
    title: 'English Conversation Club - Weekly Meeting',
    description: `Join our weekly English conversation practice!

This week's topic: "Technology and Future"

What we'll discuss:
• Impact of AI on daily life
• Future of work and automation
• Sustainable technology solutions

All levels welcome! Native speakers will be present to help with pronunciation and grammar. Free coffee and cookies provided.`,
    starts_at: '2025-02-12T18:00:00Z',
    ends_at: '2025-02-12T20:00:00Z',
    location: 'Cafe Kulturalna, ul. Łąkowa 29',
    image_url:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    url: 'https://english-club.pwr.edu.pl',
    verified: true,
    organization: organizations[3],
    category: categories[4], // Rozwój
  },
  {
    id: '5',
    title: 'Formula Student - Prezentacja bolidu 2025',
    description: `PWr Racing Team zaprasza na prezentację nowego bolidu Formula Student!

Program wydarzenia:
• 16:00 - Oficjalna prezentacja pojazdu
• 16:30 - Opowieści o procesie projektowania
• 17:00 - Demonstracja pracy silnika
• 17:30 - Sesja Q&A z zespołem
• 18:00 - Możliwość obejrzenia bolidu z bliska

Serdecznie zapraszamy wszystkich miłośników motoryzacji i studentów zainteresowanych dołączeniem do zespołu!`,
    starts_at: '2025-04-10T16:00:00Z',
    ends_at: '2025-04-10T19:00:00Z',
    location: 'Hala Sportowa PWr, parking',
    image_url:
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
    url: 'https://racing.pwr.edu.pl',
    verified: true,
    organization: organizations[4],
    category: categories[5], // Sport
  },
  {
    id: '6',
    title: 'Hackathon "Code for Good" - 48h kodowania dla dobroczynności',
    description: `48-godzinny hackathon łączący technologię z pomaganiem innym!

Tematy:
• Aplikacje wspierające osoby niepełnosprawne
• Rozwiązania ekologiczne
• Platformy edukacyjne
• Narzędzia dla NGO

Nagrody:
🥇 1. miejsce - 5000 zł + możliwość rozwijania projektu
🥈 2. miejsce - 3000 zł
🥉 3. miejsce - 2000 zł

Zapewnione: catering, miejsce do spania, mentoring od ekspertów branżowych.`,
    starts_at: '2025-05-15T18:00:00Z',
    ends_at: '2025-05-17T18:00:00Z',
    location: 'Budynek D-20, sale 1.01-1.05',
    image_url:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop',
    url: 'https://hackathon.pwr.edu.pl',
    verified: false,
    organization: organizations[2],
    category: categories[1], // Imprezy
  },
];
