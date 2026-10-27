import {lessons} from './lessons.js';
const activeIds = new Set(lessons.map(lesson => lesson.id));
const knownIds = new Set([...activeIds, 'estimate-storage', 'estimate-rounding']);

// Retired records remain stored but never complete a different topic.
export function restoreLocalHistory(saved) {
 return Array.isArray(saved) ? [...new Set(saved.filter(id => knownIds.has(id)))] : [];
}
export function activeLocalHistory(saved) {
 return saved.filter(id => activeIds.has(id));
}
