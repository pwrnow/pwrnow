from django.core.management.base import BaseCommand
from feature_access.models import Feature
from feature_access.utils import ensure_feature_exists


class Command(BaseCommand):
    help = 'Set up initial features for the feature access system'

    def handle(self, *args, **options):
        self.stdout.write('Setting up initial features...')
        
        # Define initial features
        features = [
            {
                'name': 'magic_parsing',
                'display_name': 'Magic Parsing',
                'description': 'AI-powered event parsing and text'
            },
            # Add more features here as needed
        ]
        
        created_count = 0
        for feature_data in features:
            feature, created = ensure_feature_exists(
                feature_data['name'],
                feature_data['display_name'],
                feature_data['description']
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created feature: {feature.display_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Feature already exists: {feature.display_name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Setup complete. Created {created_count} new features.')
        )
