export function storageObjectPathFromUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export function postImagePathFromUrl(url: string): string | null {
  return storageObjectPathFromUrl(url, "post-images");
}
