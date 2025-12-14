# Generated manually for multi-org support

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_alter_event_image_alter_eventmaplocation_image_and_more"),
    ]

    operations = [
        # Add short_name field to Organization
        migrations.AddField(
            model_name="organization",
            name="short_name",
            field=models.CharField(
                blank=True,
                help_text="Short display name (used in event headers when space is limited)",
                max_length=50,
                null=True,
            ),
        ),
        # Create EventCoHost model
        migrations.CreateModel(
            name="EventCoHost",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True)),
                (
                    "event",
                    models.ForeignKey(
                        help_text="The event being co-hosted",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="co_hosts",
                        to="core.event",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        help_text="The co-hosting organization",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="co_hosted_events",
                        to="core.organization",
                    ),
                ),
            ],
            options={
                "verbose_name": "Event Co-Host",
                "verbose_name_plural": "Event Co-Hosts",
                "ordering": ["created_at"],
            },
        ),
        # Add unique constraint
        migrations.AddConstraint(
            model_name="eventcohost",
            constraint=models.UniqueConstraint(
                fields=["event", "organization"],
                name="unique_event_cohost",
            ),
        ),
        # Add indexes
        migrations.AddIndex(
            model_name="eventcohost",
            index=models.Index(
                fields=["event", "organization"], name="core_eventc_event_i_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="eventcohost",
            index=models.Index(
                fields=["organization", "created_at"],
                name="core_eventc_org_created_idx",
            ),
        ),
    ]

