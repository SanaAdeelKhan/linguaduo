let baseIcon: HTMLImageElement | null = null

/** Updates document.title with an unread count prefix and draws a dot
 *  badge onto the favicon. Safe to call repeatedly; no-ops on the server. */
export function updateTabBadge(count: number) {
  if (typeof document === 'undefined') return

  document.title = count > 0 ? `(${count > 99 ? '99+' : count}) LinguaDuo` : 'LinguaDuo'

  if (!baseIcon) {
    baseIcon = new Image()
    baseIcon.src = '/icon-192x192.png'
  }

  const draw = () => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx || !baseIcon) return
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(baseIcon, 0, 0, size, size)

    if (count > 0) {
      const r = size * 0.17
      const cx = size - r - 1
      const cy = r + 1
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#e87da0'
      ctx.fill()
      ctx.lineWidth = size * 0.035
      ctx.strokeStyle = '#0d1117'
      ctx.stroke()
    }

    let link = document.querySelector<HTMLLinkElement>("link[data-dynamic-favicon]")
    if (!link) {
      // Remove static icon links so ours is the only one browsers can pick up
      document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach(el => el.remove())
      link = document.createElement('link')
      link.rel = 'icon'
      link.setAttribute('data-dynamic-favicon', 'true')
      document.head.appendChild(link)
    }
    link.href = canvas.toDataURL('image/png')
  }

  if (baseIcon.complete && baseIcon.naturalWidth > 0) {
    draw()
  } else {
    baseIcon.onload = draw
  }
}
