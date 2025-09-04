from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Organization
from ai.services import ScheduleParsingService
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Test AI processing functionality with sample schedule text'

    def add_arguments(self, parser):
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
            help='Custom schedule text to parse (optional)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting AI processing test...')
        )

        # Get or create test organization
        if options['org_id']:
            try:
                organization = Organization.objects.get(id=options['org_id'])
                self.stdout.write(f'Using organization: {organization.name}')
            except Organization.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Organization with ID {options["org_id"]} not found')
                )
                return
        else:
            # Create or get a test organization
            organization, created = Organization.objects.get_or_create(
                name='Test Organization',
                defaults={'slug': 'test-org'}
            )
            if created:
                self.stdout.write(f'Created test organization: {organization.name}')
            else:
                self.stdout.write(f'Using existing organization: {organization.name}')

        # Get or create test user
        user = None
        if options['user_id']:
            try:
                user = User.objects.get(id=options['user_id'])
                self.stdout.write(f'Using user: {user.email}')
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {options["user_id"]} not found')
                )
                return
        else:
            # Create or get a test user
            user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={'first_name': 'Test', 'last_name': 'User'}
            )
            if created:
                self.stdout.write(f'Created test user: {user.email}')
            else:
                self.stdout.write(f'Using existing user: {user.email}')

        # Sample schedule text
        sample_text = options.get('text') or """
        Conference Schedule - Tech Summit 2024

        Day 1 - Monday, January 15, 2024
        9:00 AM - 10:00 AM: Opening Keynote - "Future of Technology"
        10:15 AM - 11:00 AM: Panel Discussion - "AI in Business"
        11:15 AM - 12:00 PM: Workshop - "Building Scalable Applications"

        Lunch Break: 12:00 PM - 1:00 PM

        Day 1 - Monday, January 15, 2024 (continued)
        1:00 PM - 2:00 PM: Technical Session - "Cloud Architecture"
        2:15 PM - 3:00 PM: Networking Session
        3:15 PM - 4:00 PM: Closing Remarks

        Day 2 - Tuesday, January 16, 2024
        9:00 AM - 10:00 AM: Advanced Topics in Machine Learning
        10:15 AM - 11:00 AM: DevOps Best Practices
        11:15 AM - 12:00 PM: Security in Modern Applications
        """

        self.stdout.write('\nSample schedule text:')
        self.stdout.write(sample_text.strip())
        self.stdout.write('\n' + '='*50 + '\n')

        try:
            # Initialize the parsing service
            parsing_service = ScheduleParsingService()

            # Parse the schedule
            self.stdout.write('Parsing schedule with AI...')
            result = parsing_service.parse_schedule(
                raw_text=sample_text,
                organization=organization,
                user=user
            )

            # Display results
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS('✅ Schedule parsing successful!')
                )

                self.stdout.write(f"Tokens used: {result.get('tokens_used', 'N/A')}")
                self.stdout.write(f"Processing time: {result.get('processing_time_ms', 'N/A')} ms")

                if result.get('schedule_items'):
                    self.stdout.write(f"\nParsed {len(result['schedule_items'])} schedule items:")
                    for i, item in enumerate(result['schedule_items'], 1):
                        self.stdout.write(f"\n{i}. {item.get('title', 'No title')}")
                        self.stdout.write(f"   Date: {item.get('date', 'No date')}")
                        self.stdout.write(f"   Time: {item.get('start_time', 'No start time')} - {item.get('end_time', 'No end time')}")
                        if item.get('description'):
                            self.stdout.write(f"   Description: {item['description']}")

                # Show raw response if available
                if result.get('raw_response'):
                    self.stdout.write(f"\nRaw AI response:")
                    self.stdout.write(result['raw_response'])
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Schedule parsing failed!')
                )
                self.stdout.write(f"Error: {result.get('error', 'Unknown error')}")

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error during AI processing: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())

        self.stdout.write('\n' + '='*50)
        self.stdout.write(
            self.style.SUCCESS('AI processing test completed!')
        )
