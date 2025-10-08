"""Utility functions for user management"""
import random
import string


def generate_username(first_name='', last_name='', email='', user_id=None, existing_usernames=None):
    """
    Generate a unique username based on user data.

    Args:
        first_name: User's first name
        last_name: User's last name
        email: User's email
        user_id: User's ID (for fallback)
        existing_usernames: Callable that checks if username exists

    Returns:
        str: Generated unique username
    """
    def generate_random_suffix(length=4):
        """Generate random numeric suffix"""
        return ''.join(random.choices(string.digits, k=length))

    def clean_text(text):
        """Remove non-alphanumeric characters and convert to lowercase"""
        return ''.join(c.lower() for c in text if c.isalnum())

    # Strategy 1: Use first name + last name
    if first_name and last_name:
        first_clean = clean_text(first_name)
        last_clean = clean_text(last_name)

        # Take first 2 characters from each if available
        first_part = first_clean[:2] if len(first_clean) >= 2 else first_clean
        last_part = last_clean[:2] if len(last_clean) >= 2 else last_clean

        base_username = f"{first_part}{last_part}"
    # Strategy 2: Use email
    elif email:
        email_prefix = email.split('@')[0]
        email_clean = clean_text(email_prefix)
        base_username = email_clean[:4] if len(email_clean) >= 4 else email_clean
    else:
        # Fallback: use 'user'
        base_username = 'user'

    # Ensure minimum length
    if len(base_username) < 2:
        base_username = base_username.ljust(2, '0')

    # Generate username with random suffix and ensure uniqueness
    max_attempts = 10
    for attempt in range(max_attempts):
        username = f"{base_username}{generate_random_suffix()}"

        # Ensure it meets minimum length requirement
        while len(username) < 3:
            username += random.choice(string.digits)

        # Check if username already exists (if checker provided)
        if existing_usernames is None or not existing_usernames(username):
            return username

    # If all attempts failed, use ID-based username
    if user_id:
        return f"user{str(user_id)[:8]}"

    # Final fallback: use random string
    return f"user{generate_random_suffix(8)}"

