# Migration to rename verified field to visible (with visible by default)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0023_organization_short_name_eventcohost"),
    ]

    operations = [
        # Rename Event fields
        migrations.RenameField(
            model_name="event",
            old_name="verified",
            new_name="visible",
        ),
        migrations.RenameField(
            model_name="event",
            old_name="verified_at",
            new_name="visible_at",
        ),
        migrations.RenameField(
            model_name="event",
            old_name="verified_by",
            new_name="visible_by",
        ),
        # Rename Post fields
        migrations.RenameField(
            model_name="post",
            old_name="verified",
            new_name="visible",
        ),
        migrations.RenameField(
            model_name="post",
            old_name="verified_at",
            new_name="visible_at",
        ),
        # Update Event field default to True (visible by default)
        migrations.AlterField(
            model_name="event",
            name="visible",
            field=models.BooleanField(default=True),
        ),
        # Update Post field default to True (visible by default)
        migrations.AlterField(
            model_name="post",
            name="visible",
            field=models.BooleanField(default=True),
        ),
    ]
