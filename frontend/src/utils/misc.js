/*
 * Misc utilities
 */
/**
 * transform a string into a URL safe slug
 */
export const slugify = text => text
  .toString().toLowerCase()
  .replace(/\s+/g, '-')           // Replace spaces with -
  .replace(/[^\w-]+/g, '')       // Remove all non-word chars
  .replace(/--+/g, '-')         // Replace multiple - with single -
  .replace(/^-+/, '')             // Trim - from start of text
  .replace(/-+$/, '');            // Trim - from end of text


/**
 * Titlecase a string
 */
export const titlecase = text => text
  .toString()
  .trim()         // trim front and back of string
  .split(/\s+/)   // split on whitespace
  // capitalize first letter of each word
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  // rejoin with single spaces
  .join(' ');
