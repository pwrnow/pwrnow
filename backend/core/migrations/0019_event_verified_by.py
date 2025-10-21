# Generated manually for adding verified_by field to Event model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_alter_event_url'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='verified_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='verified_events',
                to='users.user',
                help_text='User who verified this event',
                db_index=True
            ),
        ),
    ]
