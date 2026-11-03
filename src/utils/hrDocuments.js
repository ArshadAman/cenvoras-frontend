import { hrApi } from '../api/hr';

export function isRemoteDocumentUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) && !url.includes('/media/');
}

export async function openHrDocument(doc) {
  if (!doc) return;
  const url = doc.file_url || doc.file;
  if (isRemoteDocumentUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  if (!doc.id) {
    if (typeof url === 'string' && url) window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const res = await hrApi.downloadDocument(doc.id);
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}
