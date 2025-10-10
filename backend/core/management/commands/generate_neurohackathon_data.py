# pyright: reportMissingImports=false
"""
Generate realistic schedule and map data for neurohackathon events.

This command creates:
- Schedule with realistic neurohackathon activities
- Event map with locations from Politechnika Wrocławska campus
"""
from datetime import date, time
from decimal import Decimal
from typing import List, Tuple

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from core.models import Event, EventMap, EventMapLocation, Schedule, ScheduleItem


class Command(BaseCommand):
    help = "Generuj realistyczny harmonogram i dane mapy dla wydarzenia neurohackathon"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "event_slug",
            type=str,
            help="Slug wydarzenia, dla którego mają być wygenerowane dane",
        )
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Usuń istniejący harmonogram i dane mapy przed wygenerowaniem nowych",
        )

    def get_neurohackathon_schedule_items(
        self, event: Event, num_days: int
    ) -> List[Tuple[date, time, time, str, str]]:
        """
        Generate realistic neurohackathon schedule items.
        Returns list of (date, start_time, end_time, title, description).
        """
        start_date = event.starts_at.date()
        items = []

        # Dzień 1 - harmonogram
        day1_items = [
            (
                time(9, 0),
                time(9, 30),
                "Rejestracja i powitalna kawa",
                "Odbiór identyfikatorów i networking z innymi uczestnikami przy kawie i przekąskach.",
            ),
            (
                time(9, 30),
                time(10, 0),
                "Ceremonia otwarcia",
                "Słowo powitalne, wprowadzenie do neurohackatonu, zasady i formowanie zespołów.",
            ),
            (
                time(10, 0),
                time(11, 0),
                "Wykład: Wprowadzenie do neuronauki obliczeniowej",
                "Przegląd aktualnych trendów w neuronaukach obliczeniowych, interfejsach mózg-komputer i analizie danych neuronalnych.",
            ),
            (
                time(11, 0),
                time(11, 15),
                "Przerwa kawowa",
                "Networking i poczęstunek.",
            ),
            (
                time(11, 15),
                time(12, 15),
                "Warsztat: Podstawy przetwarzania sygnałów neuronalnych",
                "Praktyczne wprowadzenie do analizy EEG, fMRI i szeregów impulsów przy użyciu Pythona i MATLAB.",
            ),
            (
                time(12, 15),
                time(13, 30),
                "Przerwa obiadowa",
                "Lunch zapewniony. Czas na networking i dyskusję o pomysłach projektowych z mentorami.",
            ),
            (
                time(13, 30),
                time(14, 30),
                "Warsztat: Machine Learning w neuronaukach",
                "Wprowadzenie do technik ML dla danych neuronalnych: klasyfikacja, klasteryzacja i podejścia deep learning.",
            ),
            (
                time(14, 30),
                time(15, 0),
                "Formowanie zespołów i prezentacja pomysłów",
                "Tworzenie zespołów, pitchowanie pomysłów projektowych i rozpoczęcie planowania projektu.",
            ),
            (
                time(15, 0),
                time(18, 0),
                "Sesja hackingowa 1",
                "Praca nad projektem w zespole. Mentorzy dostępni do konsultacji.",
            ),
            (
                time(18, 0),
                time(19, 0),
                "Kolacja",
                "Kolacja zapewniona. Możliwość kontynuowania dyskusji i kodowania.",
            ),
            (
                time(19, 0),
                time(22, 0),
                "Wieczorna sesja hackingowa",
                "Opcjonalna przedłużona sesja hackingowa dla zmotywowanych zespołów. Miejsce pozostaje otwarte.",
            ),
        ]

        for start_t, end_t, title, desc in day1_items:
            items.append((start_date, start_t, end_t, title, desc))

        if num_days >= 2:
            # Dzień 2 - harmonogram
            day2_date = date(start_date.year, start_date.month, start_date.day + 1)
            day2_items = [
                (
                    time(9, 0),
                    time(9, 30),
                    "Poranna kawa i synchronizacja",
                    "Poranna kawa i synchronizacja zespołów. Dzielenie się postępami i wyzwaniami.",
                ),
                (
                    time(9, 30),
                    time(10, 30),
                    "Warsztat: Interfejsy mózg-komputer",
                    "Wprowadzenie do systemów BCI, przetwarzania sygnałów w czasie rzeczywistym i zastosowań.",
                ),
                (
                    time(10, 30),
                    time(13, 0),
                    "Sesja hackingowa 2",
                    "Kontynuacja pracy nad projektem. Punkt kontrolny w połowie hackatonu z mentorami.",
                ),
                (
                    time(13, 0),
                    time(14, 0),
                    "Przerwa obiadowa",
                    "Lunch zapewniony. Networking z innymi zespołami.",
                ),
                (
                    time(14, 0),
                    time(17, 0),
                    "Finałowa sesja hackingowa",
                    "Ostatni sprint aby ukończyć projekt. Przygotowanie prezentacji i demo.",
                ),
                (
                    time(17, 0),
                    time(18, 30),
                    "Prezentacje projektów",
                    "Każdy zespół prezentuje swój projekt (5 min prezentacja + 3 min Q&A). Ocena przez panel ekspertów.",
                ),
                (
                    time(18, 30),
                    time(19, 0),
                    "Ceremonia wręczenia nagród i zakończenie",
                    "Ogłoszenie zwycięzców, nagrody i słowo na zakończenie. Grupowe zdjęcie!",
                ),
                (
                    time(19, 0),
                    time(20, 30),
                    "Networking reception",
                    "Świętuj z innymi uczestnikami, mentorami i jury. Lekkie przekąski zapewnione.",
                ),
            ]

            for start_t, end_t, title, desc in day2_items:
                items.append((day2_date, start_t, end_t, title, desc))

        return items

    def get_politechnika_wroclawska_locations(self) -> List[Tuple[str, str, Decimal, Decimal, str, int]]:
        """
        Get realistic locations from Politechnika Wrocławska campus.
        Returns list of (name, description, latitude, longitude, address, order_index).
        """
        locations = [
            (
                "Budynek C-13 (Główne miejsce wydarzenia)",
                "Główne miejsce hackatonu z dużą aulą i salami do pracy zespołowej. Wszystkie prezentacje i warsztaty odbędą się tutaj.",
                Decimal("51.1091700"),
                Decimal("17.0593800"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                0,
            ),
            (
                "Budynek C-3 (Laboratoria komputerowe)",
                "Laboratoria komputerowe z wysokowydajnymi stacjami roboczymi do analizy danych i kodowania. Dostęp do klastra obliczeniowego uczelni.",
                Decimal("51.1098200"),
                Decimal("17.0612500"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                1,
            ),
            (
                "Budynek D-1 (Rejestracja)",
                "Punkt rejestracji i informacji. Odbierz tutaj swój identyfikator i gadżety!",
                Decimal("51.1085400"),
                Decimal("17.0585300"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                2,
            ),
            (
                "Stołówka - Budynek A-1",
                "Główna stołówka uczelniana. Lunch i kolacja będą serwowane tutaj dla uczestników hackatonu.",
                Decimal("51.1073600"),
                Decimal("17.0597100"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                3,
            ),
            (
                "Sala warsztatowa - Budynek C-7",
                "Dedykowana przestrzeń warsztatowa z projektorem i tablicami. Warsztaty ML i BCI będą odbywać się tutaj.",
                Decimal("51.1094300"),
                Decimal("17.0601200"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                4,
            ),
            (
                "Strefa relaksu - Klub studencki",
                "Strefa chillu z wygodnymi siedzeniami, grami i kawą. Zrób sobie przerwę od kodowania!",
                Decimal("51.1081900"),
                Decimal("17.0579800"),
                "Wybrzeże Wyspiańskiego 27, 50-370 Wrocław",
                5,
            ),
        ]

        return locations

    @transaction.atomic
    def handle(self, *args, **options):
        event_slug = options["event_slug"]
        clear_existing = options["clear_existing"]

        # Get the event
        try:
            event = Event.objects.get(slug=event_slug)
        except Event.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Event with slug '{event_slug}' does not exist.")
            )
            return

        # Calculate number of days from event dates
        num_days = (event.ends_at.date() - event.starts_at.date()).days + 1

        self.stdout.write(f"Generating data for event: {event.title} ({event.slug})")
        self.stdout.write(f"Event dates: {event.starts_at} to {event.ends_at}")
        self.stdout.write(f"Number of days: {num_days}")

        # Clear existing data if requested
        if clear_existing:
            if hasattr(event, "schedule"):
                event.schedule.delete()
                self.stdout.write(self.style.WARNING("Deleted existing schedule"))
            if hasattr(event, "event_map"):
                event.event_map.delete()
                self.stdout.write(self.style.WARNING("Deleted existing event map"))

        # Create Schedule
        schedule, schedule_created = Schedule.objects.get_or_create(event=event)
        
        if schedule_created:
            self.stdout.write(self.style.SUCCESS("Created new schedule"))
        else:
            # Clear existing items if schedule already exists
            schedule.items.all().delete()
            self.stdout.write("Cleared existing schedule items")

        # Generate schedule items
        schedule_items_data = self.get_neurohackathon_schedule_items(event, num_days)
        schedule_items = []
        
        for item_date, start_t, end_t, title, desc in schedule_items_data:
            schedule_item = ScheduleItem(
                schedule=schedule,
                date=item_date,
                start_time=start_t,
                end_time=end_t,
                title=title,
                description=desc,
            )
            schedule_items.append(schedule_item)

        ScheduleItem.objects.bulk_create(schedule_items)
        self.stdout.write(
            self.style.SUCCESS(f"Created {len(schedule_items)} schedule items")
        )

        # Create EventMap
        event_map, map_created = EventMap.objects.get_or_create(
            event=event,
            defaults={
                "title": "Mapa kampusu neurohackatonu",
                "description": "Kluczowe lokalizacje neurohackatonu na kampusie Politechniki Wrocławskiej. "
                              "Znajdź drogę do warsztatów, laboratoriów i stref społecznych.",
                "is_active": True,
            },
        )

        if map_created:
            self.stdout.write(self.style.SUCCESS("Created new event map"))
        else:
            # Clear existing locations if map already exists
            event_map.locations.all().delete()
            self.stdout.write("Cleared existing map locations")

        # Generate map locations
        locations_data = self.get_politechnika_wroclawska_locations()
        map_locations = []

        for name, desc, lat, lng, addr, order in locations_data:
            location = EventMapLocation(
                event_map=event_map,
                name=name,
                description=desc,
                latitude=lat,
                longitude=lng,
                address=addr,
                order_index=order,
                is_active=True,
            )
            map_locations.append(location)

        EventMapLocation.objects.bulk_create(map_locations)
        self.stdout.write(
            self.style.SUCCESS(f"Created {len(map_locations)} map locations")
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Successfully generated neurohackathon data for '{event.slug}'"
            )
        )
        self.stdout.write(f"  - Schedule items: {len(schedule_items)}")
        self.stdout.write(f"  - Map locations: {len(map_locations)}")

