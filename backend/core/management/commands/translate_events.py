from django.core.management.base import BaseCommand
from django.db.models import Q
from core.models import Event
from core.tasks import translate_event_content


class Command(BaseCommand):
    help = 'Translate event titles and descriptions for events with missing translations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be translated without actually running the tasks',
        )
        parser.add_argument(
            '--event-id',
            type=str,
            nargs='+',
            help='Translate specific event(s) by ID (space-separated)',
        )
        parser.add_argument(
            '--async',
            action='store_true',
            dest='run_async',
            help='Run translation tasks asynchronously using Celery (default: synchronous)',
        )

    def handle(self, *args, **options):
        # Find events that need translation
        if options.get('event_id'):
            # Translate specific events by ID
            events = Event.objects.filter(id__in=options['event_id'])

            if events.count() == 0:
                self.stdout.write(
                    self.style.ERROR('No events found with the provided IDs.')
                )
                return
        else:
            # Find events with missing translations
            # An event needs translation if:
            # - title_pl is filled but title_en is empty, OR
            # - title_en is filled but title_pl is empty, OR
            # - description_pl is filled but description_en is empty, OR
            # - description_en is filled but description_pl is empty
            events = Event.objects.filter(
                Q(title_pl__isnull=False, title_pl__gt='', title_en__isnull=True) |
                Q(title_pl__isnull=False, title_pl__gt='', title_en='') |
                Q(title_en__isnull=False, title_en__gt='', title_pl__isnull=True) |
                Q(title_en__isnull=False, title_en__gt='', title_pl='') |
                Q(description_pl__isnull=False, description_pl__gt='', description_en__isnull=True) |
                Q(description_pl__isnull=False, description_pl__gt='', description_en='') |
                Q(description_en__isnull=False, description_en__gt='', description_pl__isnull=True) |
                Q(description_en__isnull=False, description_en__gt='', description_pl='')
            ).distinct()

        count = events.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No events found that need translation.')
            )
            return

        self.stdout.write(
            f'Found {count} event(s) that need translation.'
        )

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN - No changes will be made ===\n'))

            for event in events:
                self.stdout.write(f'\nEvent: {event.title} (ID: {event.id})')

                # Show which fields need translation
                missing_fields = []
                if event.title_pl and not event.title_en:
                    missing_fields.append('title_pl → title_en')
                if event.title_en and not event.title_pl:
                    missing_fields.append('title_en → title_pl')
                if event.description_pl and not event.description_en:
                    missing_fields.append('description_pl → description_en')
                if event.description_en and not event.description_pl:
                    missing_fields.append('description_en → description_pl')

                for field in missing_fields:
                    self.stdout.write(f'  - Would translate: {field}')

            self.stdout.write(
                self.style.WARNING(f'\nTotal: {count} event(s) would be processed')
            )
            return

        # Process each event
        processed = 0
        failed = 0
        warnings = 0

        self.stdout.write('')

        for i, event in enumerate(events, 1):
            self.stdout.write(f'[{i}/{count}] Processing: {event.title} (ID: {event.id})')

            try:
                if options['run_async']:
                    # Queue the task asynchronously
                    translate_event_content.delay(str(event.id))
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Queued for async translation')
                    )
                    processed += 1
                else:
                    # Run the task synchronously for immediate feedback
                    result = translate_event_content(str(event.id))

                    if result.get('success'):
                        translations_count = result.get('translations_count', 0)
                        warnings_count = result.get('warnings_count', 0)
                        skipped_count = result.get('skipped_count', 0)

                        if translations_count > 0:
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'  ✓ Translated {translations_count} field(s)'
                                )
                            )

                            # Show what was translated
                            for translation in result.get('translations', []):
                                self.stdout.write(
                                    f'    - {translation["source_field"]} → {translation["target_field"]} '
                                    f'({translation["tokens_used"]} tokens)'
                                )

                            processed += 1
                        else:
                            self.stdout.write(
                                self.style.WARNING(f'  ⚠ No translations needed')
                            )

                        # Show warnings if any
                        if warnings_count > 0:
                            warnings += 1
                            for warning in result.get('warnings', []):
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'  ⚠ {warning["field"]}: {warning["message"]}'
                                    )
                                )

                        # Show skipped fields
                        if skipped_count > 0:
                            for skipped in result.get('skipped', []):
                                self.stdout.write(
                                    f'  - Skipped {skipped["field"]}: {skipped["reason"]}'
                                )
                    else:
                        failed += 1
                        error_msg = result.get('error', 'Unknown error')
                        self.stdout.write(
                            self.style.ERROR(f'  ✗ Failed: {error_msg}')
                        )
            except Exception as e:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Exception: {str(e)}')
                )

        # Print summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'Translation Summary:'))
        self.stdout.write(f'  Total events: {count}')
        self.stdout.write(self.style.SUCCESS(f'  ✓ Successfully processed: {processed}'))

        if warnings > 0:
            self.stdout.write(self.style.WARNING(f'  ⚠ With warnings: {warnings}'))

        if failed > 0:
            self.stdout.write(self.style.ERROR(f'  ✗ Failed: {failed}'))

        self.stdout.write(self.style.SUCCESS('=' * 60))

        if options['run_async']:
            self.stdout.write(
                self.style.WARNING(
                    '\nNote: Tasks were queued asynchronously. '
                    'Check Celery worker logs for actual translation results.'
                )
            )

