import slugify from 'slugify';

export function slugFrom(text: string): string {
  const ascii = text.trim().normalize('NFD').replace(/\p{M}/gu, '');
  return slugify(ascii, { lower: true, strict: true });
}
