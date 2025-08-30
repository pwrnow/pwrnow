export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const isUpcoming = (dateString: string): boolean => {
  return new Date(dateString) > new Date();
};

export const handleMapLinkClick = (location: string): void => {
  if (!location) return;

  // Check if the user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Encode the location for the URL
  const encodedLocation = encodeURIComponent(location);

  // Create the appropriate maps URL
  const mapsUrl = isIOS
    ? `maps://?q=${encodedLocation}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

  // Open the maps URL in a new tab
  window.open(mapsUrl, '_blank');
};

export const truncateDescription = (
  text: string,
  maxLength: number
): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};
