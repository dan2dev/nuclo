// Cache for generated classes: maps CSS property sets to class names
const styleCache = new Map<string, string>();

// Simple hash function to generate a short hash from a string (similar to MD5 but simpler)
export function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	// Convert to positive hex string and take first 8 characters
	return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
}

// Generate a cache key from a set of CSS properties
export function generateStyleKey(styles: Record<string, string>): string {
	const sortedEntries = Object.entries(styles)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([property, value]) => `${property}:${value}`)
		.join('|');
	return sortedEntries;
}

// Get cached class name or return undefined
export function getCachedClassName(cacheKey: string): string | undefined {
	return styleCache.get(cacheKey);
}

// Set cached class name
export function setCachedClassName(cacheKey: string, className: string): void {
	styleCache.set(cacheKey, className);
}

// Check if cache has a class name
export function hasCachedClassName(cacheKey: string): boolean {
	return styleCache.has(cacheKey);
}
