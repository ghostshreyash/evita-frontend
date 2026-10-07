/**
 * One object URL per picked file, created on first use and kept.
 *
 * Deliberately never revoked. React runs an effect's cleanup on the simulated
 * unmount in development, and revoking there killed the URL while the file was
 * still on screen — the image then rendered broken, with only its alt text
 * showing. Keyed by the File in a WeakMap instead, so the same file always
 * resolves to the same live URL however often its tile mounts or a preview is
 * opened, and the entry is collected once nothing holds the file any more.
 */
const urls = new WeakMap<File, string>()

export function urlFor(file: File) {
  let url = urls.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    urls.set(file, url)
  }
  return url
}
