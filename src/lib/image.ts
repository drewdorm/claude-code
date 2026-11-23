// Shrinks photos before saving so the phone's storage lasts.
// iPhone HEIC photos are decoded by Safari and re-saved as JPEG.

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    // The decoded image stays usable after the URL is revoked.
    URL.revokeObjectURL(url)
  }
}

function toJpeg(img: HTMLImageElement, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode photo'))), 'image/jpeg', quality),
  )
}

export async function preparePhoto(file: Blob): Promise<{ image: Blob; thumb: Blob }> {
  const img = await loadImage(file)
  const [image, thumb] = await Promise.all([toJpeg(img, 1600, 0.82), toJpeg(img, 400, 0.75)])
  return { image, thumb }
}
