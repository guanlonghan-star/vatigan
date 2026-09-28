export const CACHE_VERSION = '1.0.0';
export const MEDIA_CACHE = `vatican-media-${CACHE_VERSION}`;

export function planOfflineDownload(manifest, cachedUrls) {
  const cached = cachedUrls instanceof Set ? cachedUrls : new Set(cachedUrls);
  return manifest.media.filter((url) => !cached.has(url));
}

export function obsoleteMediaCaches(cacheNames) {
  return cacheNames.filter((name) => name.startsWith('vatican-media-') && name !== MEDIA_CACHE);
}

async function cachedRelativeUrls(cache) {
  const base = new URL('./', location.href);
  return new Set((await cache.keys()).map((request) => `./${new URL(request.url).pathname.slice(base.pathname.length)}`));
}

export async function downloadOfflinePackage(onProgress = () => {}) {
  const manifestResponse = await fetch('./data/offline-manifest.json', {cache: 'no-store'});
  if (!manifestResponse.ok) throw new Error('无法读取离线清单');
  const manifest = await manifestResponse.json();
  if (manifest.version !== CACHE_VERSION) throw new Error('离线包有更新，请刷新页面');
  const cache = await caches.open(MEDIA_CACHE);
  const complete = await cachedRelativeUrls(cache);
  const missing = planOfflineDownload(manifest, complete);
  let finished = manifest.media.length - missing.length;
  onProgress({completedFiles: finished, totalFiles: manifest.media.length});
  let cursor = 0;
  const worker = async () => {
    while (cursor < missing.length) {
      const url = missing[cursor++];
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        await cache.put(url, response);
        finished += 1;
        onProgress({completedFiles: finished, totalFiles: manifest.media.length, url});
      } catch (error) {
        onProgress({completedFiles: finished, totalFiles: manifest.media.length, url, error});
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const stillMissing = planOfflineDownload(manifest, await cachedRelativeUrls(cache));
  if (stillMissing.length) throw new Error(`仍有 ${stillMissing.length} 个文件未下载，再次点击可继续`);
  await Promise.all(obsoleteMediaCaches(await caches.keys()).map((name) => caches.delete(name)));
  return {completedFiles: manifest.media.length, totalFiles: manifest.media.length};
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) return navigator.serviceWorker.register('./service-worker.js');
}
