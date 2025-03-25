import EventCard from './event-card';

// Sample events data
const eventItems = [
  {
    id: 1,
    title: 'Targi Pracy na Politechnice Wrocławskiej',
    description:
      'Roczne targi pracy na PWr. Spotkaj przedstawicieli najlepszych firm technologicznych i poznaj możliwości kariery po studiach.',
    date: '25 maj 2024',
    time: '10:00',
    location: 'Budynek C-13, PWr',
    imageUrl: '/placeholder.svg?height=600&width=600',
    category: 'Kariera',
    author: {
      name: 'Biuro Karier PWr',
      avatar: '/placeholder.svg',
    },
  },
  {
    id: 2,
    title: 'Juwenalia PWr 2024',
    description:
      'Największe święto studentów Politechniki Wrocławskiej. Trzy dni koncertów, wydarzeń sportowych i integracji studenckiej.',
    date: '24 cze 2024',
    time: '16:00',
    location: 'Kampus Główny PWr',
    imageUrl: '/placeholder.svg?height=600&width=600',
    category: 'Rozrywka',
    author: {
      name: 'Samorząd Studencki',
      avatar: '/placeholder.svg',
    },
  },
  {
    id: 3,
    title: 'Konferencja Naukowa: Innowacje w Energetyce',
    description:
      'Międzynarodowa konferencja naukowa poświęcona najnowszym rozwiązaniom w dziedzinie energetyki odnawialnej i zrównoważonego rozwoju.',
    date: '15 lip 2024',
    time: '09:00',
    location: 'Centrum Kongresowe PWr',
    imageUrl: '/placeholder.svg?height=600&width=600',
    category: 'Nauka',
    author: {
      name: 'Wydział Elektryczny',
      avatar: '/placeholder.svg',
    },
  },
  {
    id: 4,
    title: 'Dzień Otwarty Politechniki Wrocławskiej',
    description:
      'Poznaj naszą uczelnię! Prezentacje kierunków studiów, zwiedzanie laboratoriów, spotkania z wykładowcami i studentami.',
    date: '22 maj 2024',
    time: '10:00',
    location: 'Kampus Główny PWr',
    imageUrl: '/placeholder.svg?height=600&width=600',
    category: 'Edukacja',
    author: {
      name: 'Biuro Rekrutacji',
      avatar: '/placeholder.svg',
    },
  },
];

export default function EventFeed() {
  return (
    <div className='w-full max-w-3xl mx-auto'>
      {eventItems.map((item) => (
        <EventCard key={item.id} event={item} />
      ))}
    </div>
  );
}
