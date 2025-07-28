# Clipboard Image Upload Feature

This feature adds the ability to paste images directly from your clipboard into Django admin image fields for Organizations and Events.

## How to Use

### In Django Admin

1. **Navigate to the admin panel** (`/admin/`)
2. **Go to Organizations** or **Events** section
3. **Create or edit** an organization/event
4. **In the image field**, you'll see a new interface with:
    - A clipboard paste area at the top
    - The regular file upload below

### Pasting Images

1. **Copy an image** to your clipboard from anywhere:

    - Right-click on an image in a browser and "Copy image"
    - Take a screenshot (Cmd+Shift+4 on Mac, Windows+Shift+S on Windows)
    - Copy an image from any application

2. **Focus on the clipboard area** by clicking on it

3. **Paste the image** using:

    - `Ctrl+V` (Windows/Linux)
    - `Cmd+V` (Mac)

4. **Preview will appear** showing your pasted image

5. **Save the form** to upload the image

### Drag and Drop

You can also drag and drop image files directly onto the clipboard area.

### File Upload

The traditional file upload still works - use the "Choose File" button below the clipboard area.

## Features

-   ✅ **Clipboard paste support** - Paste images directly from clipboard
-   ✅ **Drag and drop** - Drop image files onto the paste area
-   ✅ **Image preview** - See the image before saving
-   ✅ **File size validation** - Respects the 5MB limit
-   ✅ **Multiple formats** - Supports JPG, PNG, WEBP, etc.
-   ✅ **Auto-naming** - Pasted images get automatic names with timestamps
-   ✅ **Clear functionality** - Remove pasted image if needed
-   ✅ **Responsive design** - Works on different screen sizes

## Technical Details

### Files Added/Modified

1. **`backend/core/widgets.py`** - Custom widget with clipboard functionality
2. **`backend/core/forms.py`** - Custom forms using the clipboard widget
3. **`backend/core/admin.py`** - Updated admin classes to use custom forms

### Browser Compatibility

-   ✅ Chrome/Chromium browsers
-   ✅ Firefox
-   ✅ Safari
-   ✅ Edge

### Security

-   Images are validated on the client side for type
-   Server-side validation still applies (size limits, etc.)
-   No additional security concerns introduced

## Troubleshooting

### Paste Not Working

-   Make sure you've clicked on the clipboard area to focus it
-   Ensure you have an image in your clipboard (not just a file path)
-   Try taking a screenshot and pasting that

### Image Too Large

-   The 5MB size limit still applies
-   Compress your image if needed
-   Error messages will appear if the file is too large

### Browser Issues

-   Refresh the page if the JavaScript isn't loading
-   Make sure JavaScript is enabled
-   Check browser console for any error messages

## Future Enhancements

Possible future improvements:

-   Image compression before upload
-   Multiple image paste support
-   Integration with cloud clipboard services
-   Mobile clipboard support improvements
