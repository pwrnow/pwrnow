import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_discord_notification(event_id):
    """
    Send a Discord notification when a new event is created.

    Args:
        event_id: The UUID of the created event
    """
    from .models import Event

    try:
        # Get the event
        event = Event.objects.select_related('category', 'organization').prefetch_related('tags').get(id=event_id)

        # Get Discord webhook URL from Django settings
        webhook_url = settings.DISCORD_WEBHOOK_URL
        if not webhook_url:
            print("DISCORD_WEBHOOK_URL not found in Django settings")
            return

        # Create a beautiful Discord embed in Polish
        embed = {
            "title": "🎉 Utworzono nowe wydarzenie!",
            "description": f"**{event.title}**",
            "color": 0x00ff00,  # Green color
            "fields": [],
            "timestamp": event.created_at.isoformat(),
            "footer": {
                "text": "PwrNow Events"
            }
        }

        # Add event image if available
        if event.image:
            image_url = f"{settings.SITE_URL}{event.image.url}"
            embed["image"] = {
                "url": image_url
            }

        # Add description if available
        if event.description:
            # Truncate description if too long (Discord limit is 1024 characters)
            description = event.description[:1000] + "..." if len(event.description) > 1000 else event.description
            embed["fields"].append({
                "name": "📝 Opis",
                "value": description,
                "inline": False
            })

        # Add timing information with Polish month names
        polish_months = {
            1: 'stycznia', 2: 'lutego', 3: 'marca', 4: 'kwietnia',
            5: 'maja', 6: 'czerwca', 7: 'lipca', 8: 'sierpnia',
            9: 'września', 10: 'października', 11: 'listopada', 12: 'grudnia'
        }

        start_month = polish_months[event.starts_at.month]
        end_month = polish_months[event.ends_at.month]

        start_time = f"{event.starts_at.day} {start_month} {event.starts_at.year} o {event.starts_at.strftime('%H:%M')}"
        end_time = f"{event.ends_at.day} {end_month} {event.ends_at.year} o {event.ends_at.strftime('%H:%M')}"

        embed["fields"].append({
            "name": "⏰ Czas wydarzenia",
            "value": f"**Rozpoczęcie:** {start_time}\n**Zakończenie:** {end_time}",
            "inline": False
        })

        # Add location if available
        if event.location:
            embed["fields"].append({
                "name": "📍 Lokalizacja",
                "value": event.location,
                "inline": False
            })

        # Add category if available
        if event.category:
            embed["fields"].append({
                "name": "🏷️ Kategoria",
                "value": event.category.name,
                "inline": False
            })

        # Add organization if available
        if event.organization:
            embed["fields"].append({
                "name": "🏢 Organizacja",
                "value": event.organization.name,
                "inline": False
            })

        # Add tags if available
        if event.tags.exists():
            tags_text = ", ".join([tag.name for tag in event.tags.all()])
            embed["fields"].append({
                "name": "🏷️ Tagi",
                "value": tags_text,
                "inline": False
            })

        # Add admin panel URL for this specific event
        admin_url = f"{settings.SITE_URL}/admin/core/event/{event.id}/change/" if hasattr(settings, 'SITE_URL') else f"http://localhost:8000/admin/core/event/{event.id}/change/"
        embed["fields"].append({
            "name": "🔗 Panel administracyjny",
            "value": f"[Kliknij tutaj]({admin_url})",
            "inline": False
        })

        # Add verification status
        status_emoji = "✅" if event.verified else "⏳"
        status_text = "Zweryfikowane" if event.verified else "Oczekuje weryfikacji"
        embed["fields"].append({
            "name": "📋 Status",
            "value": f"{status_emoji} {status_text}",
            "inline": False
        })

        # Prepare the Discord webhook payload
        payload = {
            "embeds": [embed],
            "username": "🤖 Slave",
            "avatar_url": "https://cdn.discordapp.com/attachments/123456789/987654321/event-icon.png"  # You can replace with your own icon
        }

        # Send the webhook
        response = requests.post(webhook_url, json=payload, timeout=10)

        if response.status_code == 204:
            print(f"Discord notification sent successfully for event: {event.title}")
        else:
            print(f"Failed to send Discord notification. Status code: {response.status_code}, Response: {response.text}")

    except Event.DoesNotExist:
        print(f"Event with ID {event_id} not found")
    except Exception as e:
        print(f"Error sending Discord notification: {str(e)}")


@shared_task
def translate_event_content(event_id, target_languages=None):
    """
    TODO: Implement automatic translation for event content.

    This task should translate event title and description from Polish to English
    when a new event is created.

    Args:
        event_id: The UUID of the event to translate
        target_languages: List of language codes to translate to (defaults to ['en'])
    """
    from .models import Event

    if target_languages is None:
        target_languages = ['en']  # Default to English translation

    try:
        # Get the event
        event = Event.objects.get(id=event_id)

        logger.info(f"TODO: Implement translation for event: {event.title} (ID: {event_id})")

        # TODO: Implement actual translation logic here
        # 1. Check if translation fields are empty
        # 2. Call translation service (Google Translate, OpenAI, DeepL, etc.)
        # 3. Update the translation fields:
        #    - event.title_en = translated_title
        #    - event.description_en = translated_description
        # 4. Save the event with updated fields

        return {
            'event_id': str(event_id),
            'event_title': event.title,
            'message': 'Translation not implemented yet - TODO',
            'success': False
        }

    except Event.DoesNotExist:
        error_msg = f"Event with ID {event_id} not found"
        logger.error(error_msg)
        return {
            'event_id': str(event_id),
            'error': error_msg,
            'success': False
        }
    except Exception as e:
        error_msg = f"Error in translation task: {str(e)}"
        logger.error(error_msg)
        return {
            'event_id': str(event_id),
            'error': error_msg,
            'success': False
        }



