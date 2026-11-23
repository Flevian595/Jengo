// crypto.randomUUID is missing on non-secure origins (e.g. http://192.168.x.x when
// testing on a phone), so use a plain generator.
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
