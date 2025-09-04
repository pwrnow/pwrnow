import requests
from celery import shared_task
from django.conf import settings
import logging
from PIL import Image

logger = logging.getLogger(__name__)


def detect_image_aspect_ratio(width, height):
    """
    Unified function to detect the most appropriate aspect ratio category for an image.

    Args:
        width (int): Image width in pixels
        height (int): Image height in pixels

    Returns:
        str: The most appropriate aspect ratio category ('1:1', '16:9', '4:3', '3:2')
    """
    if width <= 0 or height <= 0:
        return '16:9'  # Default fallback

    # Calculate actual ratio
    ratio = width / height

    # Define standard ratios with their numeric values and tolerance
    standard_ratios = [
        ('1:1', 1.0, 0.1),
        ('4:3', 4/3, 0.1),
        ('3:2', 3/2, 0.1),
        ('16:9', 16/9, 0.1),
    ]

    # Find the closest matching standard ratio
    best_match = None
    min_difference = float('inf')

    for ratio_name, ratio_value, tolerance in standard_ratios:
        difference = abs(ratio - ratio_value)
        if difference <= tolerance and difference < min_difference:
            best_match = ratio_name
            min_difference = difference

    # If we found a match within tolerance, return it
    if best_match:
        return best_match

    # If no match within tolerance, find the closest one
    for ratio_name, ratio_value, _ in standard_ratios:
        difference = abs(ratio - ratio_value)
        if difference < min_difference:
            best_match = ratio_name
            min_difference = difference

    # Fallback to 16:9 if something goes wrong
    return best_match or '16:9'


@shared_task
def send_discord_notification(event_id):
    """
    Send a Discord notification when a new event is created.

    Args:
        event_id: The UUID of the created event
    """
    from .models import Event

    try:
        # Suppress discord notifications if requested (e.g., during import)
        if getattr(settings, "SUPPRESS_NOTIFICATIONS", False) or getattr(settings, "SUPPRESS_DISCORD_NOTIFICATIONS", False):
            logger.info("Discord notifications suppressed by settings; skipping")
            return
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


@shared_task
def detect_event_image_aspect_ratio(event_id):
    """
    Detect the aspect ratio of an event's image and save it to the database.

    Args:
        event_id: The UUID of the event
    """
    from .models import Event

    try:
        # Get the event
        event = Event.objects.get(id=event_id)

        # Check if event has an image
        if not event.image:
            logger.info(f"Event {event_id} has no image, skipping aspect ratio detection")
            return {
                'event_id': str(event_id),
                'message': 'No image to process',
                'success': True
            }

        # Open the image using PIL
        try:
            with event.image.open() as img_file:
                img = Image.open(img_file)
                width, height = img.size

                # Determine aspect ratio using unified function
                aspect_ratio = detect_image_aspect_ratio(width, height)

                # Update the event with the detected aspect ratio
                event.aspect_ratio = aspect_ratio
                event.save(update_fields=['aspect_ratio'])

                logger.info(f"Detected aspect ratio {aspect_ratio} for event {event_id} (image: {width}x{height})")

                return {
                    'event_id': str(event_id),
                    'aspect_ratio': aspect_ratio,
                    'dimensions': f"{width}x{height}",
                    'success': True
                }

        except Exception as e:
            logger.error(f"Error processing image for event {event_id}: {str(e)}")
            return {
                'event_id': str(event_id),
                'error': f"Image processing error: {str(e)}",
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
        error_msg = f"Error in aspect ratio detection task: {str(e)}"
        logger.error(error_msg)
        return {
            'event_id': str(event_id),
            'error': error_msg,
            'success': False
        }


@shared_task
def detect_post_image_aspect_ratio(post_image_id):
    """
    Detect the aspect ratio of a post image and save it to the database.

    Args:
        post_image_id: The UUID of the post image
    """
    from .models import PostImage

    try:
        # Get the post image
        post_image = PostImage.objects.get(id=post_image_id)

        # Check if post image has an image
        if not post_image.image:
            logger.info(f"PostImage {post_image_id} has no image, skipping aspect ratio detection")
            return {
                'post_image_id': str(post_image_id),
                'message': 'No image to process',
                'success': True
            }

        # Open the image using PIL
        try:
            with post_image.image.open() as img_file:
                img = Image.open(img_file)
                width, height = img.size

                # Determine aspect ratio using unified function
                aspect_ratio = detect_image_aspect_ratio(width, height)

                # Update the post image with the detected aspect ratio
                post_image.aspect_ratio = aspect_ratio
                post_image.save(update_fields=['aspect_ratio'])

                logger.info(f"Detected aspect ratio {aspect_ratio} for post image {post_image_id} (image: {width}x{height})")

                return {
                    'post_image_id': str(post_image_id),
                    'aspect_ratio': aspect_ratio,
                    'dimensions': f"{width}x{height}",
                    'success': True
                }

        except Exception as e:
            logger.error(f"Error processing image for post image {post_image_id}: {str(e)}")
            return {
                'post_image_id': str(post_image_id),
                'error': f"Image processing error: {str(e)}",
                'success': False
            }

    except PostImage.DoesNotExist:
        error_msg = f"PostImage with ID {post_image_id} not found"
        logger.error(error_msg)
        return {
            'post_image_id': str(post_image_id),
            'error': error_msg,
            'success': False
        }
    except Exception as e:
        error_msg = f"Error in post image aspect ratio detection task: {str(e)}"
        logger.error(error_msg)
        return {
            'post_image_id': str(post_image_id),
            'error': error_msg,
            'success': False
        }


@shared_task
def bulk_detect_event_aspect_ratios():
    """
    Detect aspect ratios for all events that have images but no aspect ratio set.

    Returns:
        dict: Summary of processing results
    """
    from .models import Event

    try:
        # Find events with images but no aspect ratio
        events_needing_detection = Event.objects.filter(
            image__isnull=False,
            aspect_ratio__isnull=True
        ) | Event.objects.filter(
            image__isnull=False,
            aspect_ratio=''
        )

        total_count = events_needing_detection.count()
        processed_count = 0
        error_count = 0

        logger.info(f"Starting bulk aspect ratio detection for {total_count} events")

        for event in events_needing_detection:
            try:
                result = detect_event_image_aspect_ratio(str(event.id))
                if result['success']:
                    processed_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Failed to process event {event.id}: {result.get('error', 'Unknown error')}")
            except Exception as e:
                error_count += 1
                logger.error(f"Error processing event {event.id}: {str(e)}")

        logger.info(f"Bulk aspect ratio detection completed: {processed_count} processed, {error_count} errors")

        return {
            'total_events': total_count,
            'processed': processed_count,
            'errors': error_count,
            'success': True
        }

    except Exception as e:
        error_msg = f"Error in bulk aspect ratio detection: {str(e)}"
        logger.error(error_msg)
        return {
            'error': error_msg,
            'success': False
        }


@shared_task
def bulk_detect_post_image_aspect_ratios():
    """
    Detect aspect ratios for all post images that have images but no aspect ratio set.

    Returns:
        dict: Summary of processing results
    """
    from .models import PostImage

    try:
        # Find post images with images but no aspect ratio
        post_images_needing_detection = PostImage.objects.filter(
            image__isnull=False,
            aspect_ratio__isnull=True
        ) | PostImage.objects.filter(
            image__isnull=False,
            aspect_ratio=''
        )

        total_count = post_images_needing_detection.count()
        processed_count = 0
        error_count = 0

        logger.info(f"Starting bulk aspect ratio detection for {total_count} post images")

        for post_image in post_images_needing_detection:
            try:
                result = detect_post_image_aspect_ratio(str(post_image.id))
                if result['success']:
                    processed_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Failed to process post image {post_image.id}: {result.get('error', 'Unknown error')}")
            except Exception as e:
                error_count += 1
                logger.error(f"Error processing post image {post_image.id}: {str(e)}")

        logger.info(f"Bulk post image aspect ratio detection completed: {processed_count} processed, {error_count} errors")

        return {
            'total_post_images': total_count,
            'processed': processed_count,
            'errors': error_count,
            'success': True
        }

    except Exception as e:
        error_msg = f"Error in bulk post image aspect ratio detection: {str(e)}"
        logger.error(error_msg)
        return {
            'error': error_msg,
            'success': False
        }