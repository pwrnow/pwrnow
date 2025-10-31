# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_event_verified_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='organizationcode',
            name='type',
            field=models.CharField(
                choices=[('organization', 'Organization'), ('admin', 'Admin')],
                db_index=True,
                default='organization',
                help_text='Type of organization code: Organization codes are for organization users, Admin codes are for system administrators',
                max_length=20
            ),
        ),
    ]

