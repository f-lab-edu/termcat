export function getSocketPath(): string {
  const uid = process.getuid?.() ?? 'default'
  return `/tmp/termcat-${uid}.sock`
}
