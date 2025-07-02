export function removeBullet(text: string): string {
  return text.replace(/^([\s\*\-\d\.]+)+/, '').trim();
}