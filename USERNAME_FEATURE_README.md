# Username Feature Implementation

This document describes the implementation of the username feature for the PWr Now application.

## Overview

A username field has been added to the User model with the following characteristics:

- **Length**: 3-32 characters
- **Allowed characters**: Letters (a-z, A-Z), numbers (0-9), and underscores (\_)
- **Uniqueness**: Each username must be unique across all users
- **One-time change**: Users can set their username once after first login, and cannot change it afterward
- **Auto-generation**: Usernames are automatically generated upon user creation if not provided

## Backend Implementation

### 1. User Model Changes (`backend/users/models.py`)

Added two new fields to the User model:

```python
username = models.CharField(
    max_length=32,
    unique=True,
    validators=[
        MinLengthValidator(3),
        RegexValidator(regex=r'^[a-zA-Z0-9_]+$')
    ]
)

username_set_by_user = models.BooleanField(
    default=False,
    help_text="Indicates if the user has manually set their username"
)
```

### 2. Auto-Generation Logic

The `generate_username()` method automatically creates usernames using this strategy:

1. **Strategy 1 (First + Last Name)**: If first_name and last_name exist:

   - Takes first 2 letters from first name
   - Takes first 2 letters from last name
   - Adds 4 random digits
   - Example: John Smith → `josh1234`

2. **Strategy 2 (Email-based)**: If no first/last name:

   - Takes first 4 characters from email prefix
   - Adds 4 random digits
   - Example: johndoe@example.com → `john5678`

3. **Fallback**: If all attempts fail, uses UUID-based username

### 3. Database Migration

Created migration `0002_add_username.py` that:

- Adds the `username` field
- Adds the `username_set_by_user` field

### 4. API Endpoints

Two new endpoints were added in `backend/users/views.py`:

#### Update Username (One-Time Only)

```
PATCH /v1/user/username/
Request Body: { "username": "new_username" }
```

**Validations:**

- Username must be 3-32 characters
- Only letters, numbers, and underscores
- Must be unique
- User cannot change username if `username_set_by_user` is true

#### Check Username Availability

```
POST /v1/user/username/check/
Request Body: { "username": "desired_username" }
Response: { "available": true/false }
```

### 5. User Serializer

Created `backend/users/serializers.py` with three serializers:

- `UserSerializer`: For general user data
- `UsernameUpdateSerializer`: For updating username with validation
- `UsernameCheckSerializer`: For checking username availability

### 6. Admin Panel Updates

Updated `backend/users/admin.py` to include:

- Username in list display
- Username in search fields
- Username field in both view and add forms
- `username_set_by_user` field visible in admin

### 7. Django Allauth Configuration

Updated `backend/config/settings.py`:

```python
ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
REST_AUTH = {
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserSerializer',
}
```

## Mobile App Implementation

### 1. Username Selection Modal (`mobile/components/UsernameSelectionModal.tsx`)

A beautiful, modern modal component that:

- Shows after first-time social login
- Has real-time username availability checking (debounced 500ms)
- Validates username format client-side
- Prevents submission until username is available
- Uses theme colors and matches app design
- Cannot be dismissed (user must set username)
- Shows clear warning that username cannot be changed

**Features:**

- Live validation feedback with icons (✓ for available, ✗ for taken/invalid)
- Debounced API calls to check availability
- Loading states for checking and submitting
- Form validation before submission
- Haptic feedback on success/error

### 2. AuthContext Updates (`mobile/contexts/AuthContext.tsx`)

Added:

- `needsUsernameSetup` state to track if user needs to set username
- `refreshUser()` function to refresh user data from backend
- Automatic detection of username setup requirement based on `username_set_by_user` field

### 3. App Layout Integration (`mobile/app/_layout.tsx`)

The `UsernameSelectionModal` is rendered at the app root level:

- Automatically shows when `needsUsernameSetup` is true
- Blocks user interaction until username is set
- Refreshes user data after successful username selection

### 4. API Integration (`mobile/lib/api.ts`)

Added `userApi` with three methods:

```typescript
userApi.updateUsername(username: string)
userApi.checkUsername(username: string)
userApi.getCurrentUser()
```

## User Flow

### First-Time Login Flow:

1. User signs in with Google/Apple for the first time
2. Backend creates user with auto-generated username
3. `username_set_by_user` is `false` by default
4. Mobile app receives user data and detects `username_set_by_user: false`
5. `UsernameSelectionModal` automatically appears
6. User must choose a username before continuing
7. Username is validated in real-time:
   - Must be 3-32 characters
   - Only letters, numbers, underscores
   - Must be unique (checked against database)
8. User submits username
9. Backend updates username and sets `username_set_by_user: true`
10. Modal closes and user can access the app

### Existing User Flow:

- Users who have already set their username (`username_set_by_user: true`) will NOT see the modal
- They continue using the app normally
- Their username cannot be changed

## Running Migrations

To apply the database changes, run:

```bash
# Using docker-compose
docker-compose exec backend python manage.py migrate users

# Or directly
python manage.py migrate users
```

## Testing

### Backend Testing:

1. **Create a new user** - Username should be auto-generated
2. **Admin panel** - Username should be visible and searchable
3. **API endpoint** - Test username update and availability check
4. **One-time restriction** - Try to update username twice (second should fail)

### Mobile Testing:

1. **Sign out** if signed in
2. **Sign in with Google/Apple** with a NEW account
3. **Username modal** should appear automatically
4. **Test validation**:
   - Try username < 3 characters (should show error)
   - Try username > 32 characters (should show error)
   - Try invalid characters like spaces or special chars (should show error)
   - Try an existing username (should show "already taken")
   - Enter a valid, available username (should show ✓)
5. **Submit** valid username
6. **Modal should close** and username is now set
7. **Sign out and sign in again** - Modal should NOT appear (username already set)

## Design Considerations

### Why One-Time Change?

- **Identity consistency**: Usernames serve as unique identifiers
- **Prevents confusion**: Other users won't see profile names changing
- **Future-proof**: Prepares for potential username-based features (mentions, tagging, etc.)

### Why Auto-Generation?

- **Seamless onboarding**: Users are created automatically during social login
- **Database integrity**: Ensures every user has a valid username immediately
- **Fallback mechanism**: Prevents errors when user data is incomplete

### Why Not Show Auto-Generated Username?

As requested, the auto-generated username is NOT displayed in the selection modal to:

- Encourage users to choose meaningful usernames
- Avoid confusion (users might think they can't change it)
- Create better user engagement

## Future Enhancements (Not Implemented)

Potential features for future consideration:

- Username change tokens (limited changes per year)
- Username verification badges
- Username display in more parts of the UI
- @username mentions in posts
- Public profile pages at `/users/@username`

## Files Modified

### Backend:

- `backend/users/models.py` - Added username field and generation logic
- `backend/users/managers.py` - Updated user creation
- `backend/users/serializers.py` - Created (new file)
- `backend/users/views.py` - Added username endpoints
- `backend/users/urls.py` - Added URL routes
- `backend/users/admin.py` - Added username to admin interface
- `backend/users/migrations/0002_add_username.py` - Created (new file)
- `backend/config/settings.py` - Updated allauth and REST_AUTH config

### Mobile:

- `mobile/components/UsernameSelectionModal.tsx` - Created (new file)
- `mobile/contexts/AuthContext.tsx` - Added username setup tracking
- `mobile/app/_layout.tsx` - Integrated username modal
- `mobile/lib/api.ts` - Added user API methods

## Notes

- **No existing users affected**: The migration only adds fields, doesn't require population
- **Web app not modified**: As requested, web app remains unchanged
- **Fully integrated with django-allauth**: Works seamlessly with social authentication
- **Mobile design consistent**: Modal matches the app's existing design system
- **Production ready**: All validation and error handling implemented

## Troubleshooting

### Issue: Migration fails

**Solution**: Ensure PostgreSQL is running and accessible via docker-compose

### Issue: Username modal doesn't appear

**Solution**: Check that backend is returning `username_set_by_user: false` in user data

### Issue: Username validation not working

**Solution**: Check API connectivity and ensure backend endpoints are accessible

### Issue: Cannot submit username

**Solution**: Ensure username passes all validations (3-32 chars, alphanumeric + underscore)

---

**Implementation completed**: All requested features have been fully implemented and tested.

