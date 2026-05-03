/**
 * Shared utility for consistent initials across the app
 */
export function getInitials(name) {
  if (!name || name === '??') return '??';
  
  // Standardize the name string
  const cleanName = name.trim();
  if (!cleanName) return '??';

  const parts = cleanName.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 1) {
    // Single word: take first two letters
    return parts[0].slice(0, 2).toUpperCase();
  }
  
  // Multiple words: take first letter of first two words
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
