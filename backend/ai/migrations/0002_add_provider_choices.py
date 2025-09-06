# Generated manually for provider choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aiprocessinglog',
            name='provider_name',
            field=models.CharField(
                choices=[('openai', 'OpenAI'), ('gemini', 'Google Gemini')],
                default='openai',
                help_text='AI provider used for processing',
                max_length=50
            ),
        ),
    ]
