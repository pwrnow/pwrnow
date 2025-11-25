"""
Predefined reminder messages organized by time until event.

Messages are organized into time brackets:
- 24h+: Far future reminders
- 12-24h: Day-before reminders
- 6-12h: Same-day morning/evening reminders
- 3-6h: Getting close reminders
- 1-3h: Soon reminders
- 0-1h: Last minute reminders
- started: Event has already started
- ended: Event has ended

Each bracket contains multiple message options for variety.
Messages use Django translation for i18n support.
"""

from django.utils.translation import gettext_lazy as _


# Message brackets organized by hours until event
# Each bracket: (min_hours, max_hours, bracket_key, display_name)
TIME_BRACKETS = [
    (24, float('inf'), 'far_future', _('More than 24 hours')),
    (12, 24, 'day_before', _('12-24 hours before')),
    (6, 12, 'half_day', _('6-12 hours before')),
    (3, 6, 'getting_close', _('3-6 hours before')),
    (1, 3, 'soon', _('1-3 hours before')),
    (0, 1, 'last_minute', _('Less than 1 hour')),
    (-float('inf'), 0, 'started', _('Event has started')),
]


# Predefined messages for each time bracket
# Format: {bracket_key: [(title, body), ...]}
# Use {event_title}, {location}, {time} as placeholders
REMINDER_MESSAGES = {
    'far_future': [
        (
            _("📅 Don't forget!"),
            _("'{event_title}' is coming up. Mark your calendar!")
        ),
        (
            _("🎯 Event reminder"),
            _("'{event_title}' - make sure you're ready!")
        ),
        (
            _("✨ Coming soon"),
            _("'{event_title}' is approaching. Get excited!")
        ),
    ],

    'day_before': [
        (
            _("⏰ Tomorrow's the day!"),
            _("'{event_title}' is happening tomorrow. Get ready!")
        ),
        (
            _("🌟 See you tomorrow!"),
            _("'{event_title}' starts tomorrow. Don't miss it!")
        ),
        (
            _("📆 Heads up!"),
            _("'{event_title}' is tomorrow. Plan your day!")
        ),
        (
            _("🎉 Almost time!"),
            _("'{event_title}' is just around the corner - tomorrow!")
        ),
        (
            _("💫 24 hours to go"),
            _("'{event_title}' starts in about 24 hours!")
        ),
    ],

    'half_day': [
        (
            _("🌅 Today's the day!"),
            _("'{event_title}' is happening today. Get ready!")
        ),
        (
            _("☀️ Event today!"),
            _("'{event_title}' - see you there later today!")
        ),
        (
            _("🎊 It's today!"),
            _("'{event_title}' is today. Excitement loading...")
        ),
        (
            _("📍 Mark the spot"),
            _("'{event_title}' kicks off today. Know where to go!")
        ),
    ],

    'getting_close': [
        (
            _("🚀 Getting close!"),
            _("'{event_title}' starts in a few hours. Almost there!")
        ),
        (
            _("⏱️ Few hours left"),
            _("'{event_title}' is coming up soon. Ready?")
        ),
        (
            _("🎯 On your marks..."),
            _("'{event_title}' starts soon. Time to prepare!")
        ),
        (
            _("✨ The countdown"),
            _("'{event_title}' in just a few hours!")
        ),
        (
            _("🔔 Time check"),
            _("'{event_title}' - only a few hours away!")
        ),
    ],

    'soon': [
        (
            _("🚀 Only 3 hours left!"),
            _("'{event_title}' - are you ready?")
        ),
        (
            _("⏰ Tick tock..."),
            _("'{event_title}' starts very soon!")
        ),
        (
            _("🎉 Almost there!"),
            _("'{event_title}' begins in just a moment!")
        ),
        (
            _("👟 Get your shoes on!"),
            _("'{event_title}' is starting soon. Time to go!")
        ),
        (
            _("🔥 Hype time!"),
            _("'{event_title}' starts very soon. Get hyped!")
        ),
        (
            _("💨 Soon... very soon"),
            _("'{event_title}' - the wait is almost over!")
        ),
        (
            _("🏃 Time to move!"),
            _("'{event_title}' is about to begin!")
        ),
    ],

    'last_minute': [
        (
            _("🏃 GO GO GO!"),
            _("'{event_title}' starts in less than an hour!")
        ),
        (
            _("⚡ Final call!"),
            _("'{event_title}' is about to start! Hurry!")
        ),
        (
            _("🎬 Showtime!"),
            _("'{event_title}' begins any moment now!")
        ),
        (
            _("🚨 Last chance!"),
            _("'{event_title}' - don't miss the start!")
        ),
        (
            _("⏰ Minutes away!"),
            _("'{event_title}' starts in minutes. Are you there?")
        ),
        (
            _("🎯 It's happening!"),
            _("'{event_title}' is starting NOW!")
        ),
    ],

    'started': [
        (
            _("🎉 It's happening!"),
            _("'{event_title}' has started. Join in!")
        ),
        (
            _("🔴 LIVE NOW"),
            _("'{event_title}' is happening right now!")
        ),
        (
            _("⚡ In progress"),
            _("'{event_title}' has begun. Don't miss it!")
        ),
        (
            _("🎊 Event is live!"),
            _("'{event_title}' - the fun has started!")
        ),
        (
            _("🏃 Still time!"),
            _("'{event_title}' started but you can still join!")
        ),
    ],
}


def get_time_bracket(hours_until_event: float) -> tuple:
    """
    Get the time bracket for a given number of hours until event.

    Args:
        hours_until_event: Hours until event starts (negative if started)

    Returns:
        Tuple of (bracket_key, display_name)
    """
    for min_h, max_h, key, display in TIME_BRACKETS:
        if min_h <= hours_until_event < max_h:
            return key, display
    return 'started', _('Event has started')


def get_messages_for_bracket(bracket_key: str) -> list:
    """
    Get all available messages for a time bracket.

    Args:
        bracket_key: The bracket key (e.g., 'soon', 'last_minute')

    Returns:
        List of (title, body) tuples
    """
    return REMINDER_MESSAGES.get(bracket_key, REMINDER_MESSAGES['far_future'])


def get_message_choices_for_event(event, now=None) -> list:
    """
    Get formatted message choices for an event based on current time.

    Args:
        event: Event instance
        now: Optional datetime for testing (defaults to timezone.now())

    Returns:
        List of dicts with message options:
        [
            {
                'id': 0,
                'bracket': 'soon',
                'bracket_display': '1-3 hours before',
                'title': 'formatted title',
                'body': 'formatted body',
                'preview': 'short preview'
            },
            ...
        ]
    """
    from django.utils import timezone

    if now is None:
        now = timezone.now()

    if not event.starts_at:
        return []

    # Calculate hours until event
    time_diff = event.starts_at - now
    hours_until = time_diff.total_seconds() / 3600

    # Get appropriate bracket
    bracket_key, bracket_display = get_time_bracket(hours_until)

    # Get messages and format them
    messages = get_messages_for_bracket(bracket_key)

    choices = []
    for idx, (title_template, body_template) in enumerate(messages):
        # Format with event data
        format_data = {
            'event_title': event.title,
            'location': event.location or '',
            'time': event.starts_at.strftime('%H:%M') if event.starts_at else '',
        }

        title = str(title_template).format(**format_data)
        body = str(body_template).format(**format_data)

        choices.append({
            'id': idx,
            'bracket': bracket_key,
            'bracket_display': str(bracket_display),
            'hours_until': round(hours_until, 1),
            'title': title,
            'body': body,
            'preview': f"{title[:30]}... - {body[:50]}..."
        })

    return choices


def get_all_brackets_with_messages() -> dict:
    """
    Get all time brackets with their messages for admin display.

    Returns:
        Dict of bracket_key -> {display_name, messages: [(title, body), ...]}
    """
    result = {}
    for _, _, key, display in TIME_BRACKETS:
        result[key] = {
            'display_name': str(display),
            'messages': [
                (str(title), str(body))
                for title, body in REMINDER_MESSAGES.get(key, [])
            ]
        }
    return result

