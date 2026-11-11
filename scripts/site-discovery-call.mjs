/** Apply the approved public invitation without changing historical bookings. */
export function applyDiscoveryCallCopy(html) {
  return html
    .replace(/(?:free\s+)?30-minute\s+(?:initial\s+)?Zoom\s+(?:call|conversation|consultation)/gi, '15-minute Discovery Call')
    .replace(/(?:free\s+)?initial\s+(?:Zoom\s+)?(?:call|consultation)/gi, 'Discovery Call')
    .replace(/first session free/gi, 'Discovery Call - 15 mins')
    .replace(/free\s+(?:15-minute\s+)?Discovery Call/gi, '15-minute Discovery Call')
    .replace(/30-minute Discovery Call/gi, '15-minute Discovery Call');
}
