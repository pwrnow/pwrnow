from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Organization, Event
from ai.services import ScheduleParsingService, EventTranslationService
import json
import logging

User = get_user_model()

class Command(BaseCommand):
    help = 'Test AI processing functionality (Schedule Parsing & Translation) with debug output'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mode',
            type=str,
            choices=['parse', 'translate'],
            default='parse',
            help='Mode of operation: "parse" for schedule parsing, "translate" for event translation'
        )
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization ID to use for testing (optional)',
        )
        parser.add_argument(
            '--user-id',
            type=str,
            help='User ID to use for testing (optional)',
        )
        parser.add_argument(
            '--text',
            type=str,
            help='Custom text to parse or translate (optional)',
        )
        parser.add_argument(
            '--event-id',
            type=str,
            help='Event ID to translate (for "translate" mode)',
        )
        parser.add_argument(
            '--source-lang',
            type=str,
            default='pl',
            help='Source language for translation (default: pl)',
        )
        parser.add_argument(
            '--target-lang',
            type=str,
            default='en',
            help='Target language for translation (default: en)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting AI processing test...'))

        # Setup Org and User
        organization = self._get_or_create_org(options.get('org_id'))
        user = self._get_or_create_user(options.get('user_id'))

        mode = options['mode']

        if mode == 'parse':
            self._handle_parsing(options, organization, user)
        elif mode == 'translate':
            self._handle_translation(options, organization, user)

        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('AI processing test completed!'))

    def _get_or_create_org(self, org_id):
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
                self.stdout.write(f'Using organization: {org.name}')
                return org
            except Organization.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Organization with ID {org_id} not found'))
                return None

        org, created = Organization.objects.get_or_create(
            name='Test Organization',
            defaults={'slug': 'test-org'}
        )
        self.stdout.write(f"{'Created' if created else 'Using'} test organization: {org.name}")
        return org

    def _get_or_create_user(self, user_id):
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                self.stdout.write(f'Using user: {user.email}')
                return user
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User with ID {user_id} not found'))
                return None

        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={'first_name': 'Test', 'last_name': 'User'}
        )
        self.stdout.write(f"{'Created' if created else 'Using'} test user: {user.email}")
        return user

    def _handle_parsing(self, options, organization, user):
        self.stdout.write('\n--- Schedule Parsing Mode ---')
        text = options.get('text') or self._get_sample_schedule_text()

        self.stdout.write('\nInput Text:')
        self.stdout.write(text.strip())
        self.stdout.write('-' * 50)

        try:
            service = ScheduleParsingService()
            self.stdout.write('Calling ScheduleParsingService...')

            result = service.parse_schedule(
                raw_text=text,
                organization=organization,
                user=user
            )

            self._print_result(result)

            if result['success'] and result.get('schedule_items'):
                self.stdout.write(f"\nParsed {len(result['schedule_items'])} items:")
                for i, item in enumerate(result['schedule_items'], 1):
                    self.stdout.write(f"\n{i}. {item.get('title')}")
                    self.stdout.write(f"   Time: {item.get('date')} {item.get('start_time')} - {item.get('end_time')}")
                    if item.get('description'):
                        self.stdout.write(f"   Desc: {item.get('description')}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())

    def _handle_translation(self, options, organization, user):
        self.stdout.write('\n--- Translation Mode ---')
        service = EventTranslationService()

        event_id = options.get('event_id')
        custom_text = options.get('text')

        if event_id:
            self._translate_event(service, event_id, organization, user)
        elif custom_text:
            self._translate_text(service, custom_text, options['source_lang'], options['target_lang'])
        else:
            self.stdout.write(self.style.WARNING('Please provide --event-id or --text for translation testing'))

    def _translate_text(self, service, text, source_lang, target_lang):
        self.stdout.write(f'\nTranslating text ({source_lang} -> {target_lang}):')
        self.stdout.write(f"Input: {text}")

        # Detect language first
        detected = service.detect_language(text)
        self.stdout.write(f"Detected Language: {detected}")

        result = service.translate_text(
            text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            is_title=(len(text) < 100) # Simple heuristic for testing
        )

        self.stdout.write('\nResult:')
        self.stdout.write(f"Success: {result['success']}")
        if result['success']:
            self.stdout.write(self.style.SUCCESS(f"Translated: {result['translated_text']}"))
        else:
            self.stdout.write(self.style.ERROR(f"Error: {result.get('error')}"))

        if 'tokens_used' in result:
            self.stdout.write(f"Tokens: {result['tokens_used']}")

    def _translate_event(self, service, event_id, organization, user):
        self.stdout.write(f'\nTranslating Event ID: {event_id}')
        try:
            event = Event.objects.get(id=event_id)
            self.stdout.write(f"Event Title (PL): {event.title_pl}")
            self.stdout.write(f"Event Desc (PL): {event.description_pl[:100]}...")

            self.stdout.write('\nCalling translate_event...')
            result = service.translate_event(event_id, organization, user)

            self.stdout.write('\nTranslation Summary:')
            self.stdout.write(f"Success: {result['success']}")

            for trans in result.get('translations', []):
                self.stdout.write(f"\nField: {trans['source_field']} -> {trans['target_field']}")
                self.stdout.write(f"Result: {trans['translated_text']}")

            for warn in result.get('warnings', []):
                self.stdout.write(self.style.WARNING(f"Warning [{warn['field']}]: {warn['message']}"))

        except Event.DoesNotExist:
            self.stdout.write(self.style.ERROR('Event not found'))

    def _print_result(self, result):
        self.stdout.write('\nAPI Response:')
        self.stdout.write(json.dumps(result, indent=2, default=str))

    def _get_sample_schedule_text(self):
        return """
        Conference Schedule - Tech Summit 2024
        Day 1 - Monday, January 15, 2024
        9:00 AM - 10:00 AM: Opening Keynote - "Future of Technology"
        10:15 AM - 11:00 AM: Panel Discussion - "AI in Business"
        """
