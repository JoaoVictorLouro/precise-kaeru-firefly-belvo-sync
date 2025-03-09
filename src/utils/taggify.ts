export function taggifyString(prefix: string, input: string): string {
  return `[${prefix
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_/g, '')
    .replace(/_$/, '')}] ${input
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[0-9]+/g, '')
    .replace(/[0-9]+$/, '')
    .replace(/^_/g, '')
    .replace(/_$/, '')}`.trim();
}
