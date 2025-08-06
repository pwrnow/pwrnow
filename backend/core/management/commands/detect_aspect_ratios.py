from django.core.management.base import BaseCommand
from core.models import Event
from core.tasks import detect_event_image_aspect_ratio


class Command(BaseCommand):
    help = 'Detect aspect ratios for events that have images but no aspect ratio set'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually running the tasks',
        )

    def handle(self, *args, **options):
        # Find events with images but no aspect ratio
        events = Event.objects.filter(
            image__isnull=False,
            aspect_ratio__isnull=True
        )

        count = events.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No events found that need aspect ratio detection.')
            )
            return

        self.stdout.write(
            f'Found {count} events that need aspect ratio detection.'
        )

        if options['dry_run']:
            self.stdout.write('DRY RUN - Would process the following events:')
            for event in events:
                self.stdout.write(f'  - {event.title} (ID: {event.id})')
            return

        # Process each event
        processed = 0
        for event in events:
            try:
                # Run the task synchronously for immediate feedback
                result = detect_event_image_aspect_ratio(str(event.id))

                if result.get('success'):
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {event.title}: {result.get("aspect_ratio", "unknown")}'
                        )
                    )
                    processed += 1
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ {event.title}: {result.get("error", "unknown error")}'
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ {event.title}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully processed {processed} out of {count} events.')
        )