# Generated migration for username field

from django.db import migrations, models
import django.core.validators


def populate_usernames(apps, schema_editor):
    """Populate usernames for existing users"""
    # Import the shared utility function
    from users.utils import generate_username

    User = apps.get_model('users', 'User')
    db_alias = schema_editor.connection.alias

    for user in User.objects.using(db_alias).all():
        # Use shared username generation logic
        username = generate_username(
            first_name=user.first_name or '',
            last_name=user.last_name or '',
            email=user.email or '',
            user_id=user.id,
            existing_usernames=lambda u: User.objects.using(db_alias).filter(username=u).exists()
        )
        user.username = username
        user.save(using=db_alias)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # Step 1: Add username field as nullable first
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(
                max_length=32,
                null=True,
                blank=True,
                unique=True,
                validators=[
                    django.core.validators.MinLengthValidator(
                        3,
                        'Username must be at least 3 characters long'
                    ),
                    django.core.validators.RegexValidator(
                        regex='^[a-zA-Z0-9_]+$',
                        message='Username can only contain letters, numbers, and underscores'
                    )
                ],
                verbose_name='username',
                help_text='Required. 3-32 characters. Letters, numbers, and underscores only.'
            ),
        ),
        # Step 2: Populate usernames for existing users
        migrations.RunPython(
            populate_usernames,
            reverse_code=migrations.RunPython.noop
        ),
        # Step 3: Make username non-nullable
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(
                max_length=32,
                unique=True,
                validators=[
                    django.core.validators.MinLengthValidator(
                        3,
                        'Username must be at least 3 characters long'
                    ),
                    django.core.validators.RegexValidator(
                        regex='^[a-zA-Z0-9_]+$',
                        message='Username can only contain letters, numbers, and underscores'
                    )
                ],
                verbose_name='username',
                help_text='Required. 3-32 characters. Letters, numbers, and underscores only.'
            ),
        ),
        # Step 4: Add username_set_by_user field
        migrations.AddField(
            model_name='user',
            name='username_set_by_user',
            field=models.BooleanField(
                default=False,
                verbose_name='username set by user',
                help_text='Indicates if the user has manually set their username'
            ),
        ),
    ]

