from django.core.management.base import BaseCommand
from core.models import Organization, OrganizationCode


class Command(BaseCommand):
    help = 'Ensure each organization has at least one code for each type (ORGANIZATION and ADMIN)'

    def handle(self, *args, **options):
        organizations = Organization.objects.all()
        created_count = 0
        existing_count = 0

        for organization in organizations:
            # Check for ORGANIZATION type code
            org_codes = organization.auth_codes.filter(type=OrganizationCode.CodeType.ORGANIZATION)
            has_org_code = org_codes.exists()

            # Check for ADMIN type code
            admin_codes = organization.auth_codes.filter(type=OrganizationCode.CodeType.ADMIN)
            has_admin_code = admin_codes.exists()

            if not has_org_code:
                OrganizationCode.objects.create(
                    organization=organization,
                    type=OrganizationCode.CodeType.ORGANIZATION
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created ORGANIZATION code for organization: {organization.name}'
                    )
                )
            else:
                existing_count += 1

            if not has_admin_code:
                OrganizationCode.objects.create(
                    organization=organization,
                    type=OrganizationCode.CodeType.ADMIN
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created ADMIN code for organization: {organization.name}'
                    )
                )
            else:
                existing_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} organization code(s).'
            )
        )
        if existing_count > 0:
            self.stdout.write(
                f'{existing_count} organization(s) already had required codes.'
            )

