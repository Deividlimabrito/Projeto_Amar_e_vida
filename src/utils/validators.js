export const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const normEmail = (v = '') => v.trim().toLowerCase();
