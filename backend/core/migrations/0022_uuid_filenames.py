# Generated manually on 2025-11-06

from django.db import migrations, models
import core.models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_add_optimized_list_query_index'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='image',
            field=models.ImageField(blank=True, help_text='Event image/poster', null=True, upload_to=core.models.upload_to_uuid_filename('events')),
        ),
        migrations.AlterField(
            model_name='eventmaplocation',
            name='image',
            field=models.ImageField(blank=True, help_text='Custom marker image for this location', null=True, upload_to=core.models.upload_to_uuid_filename('event_map_locations')),
        ),
        migrations.AlterField(
            model_name='organization',
            name='image',
            field=models.ImageField(blank=True, help_text='Organization logo/image', null=True, upload_to=core.models.upload_to_uuid_filename('organizations')),
        ),
        migrations.AlterField(
            model_name='postimage',
            name='image',
            field=models.ImageField(help_text='Image file', upload_to=core.models.upload_to_uuid_filename('posts')),
        ),
    ]

