/** Apply the approved public invitation without changing historical bookings. */
export function applyDiscoveryCallCopy(html) {
  return html
    .replace(/\b(?:free,?\s+)?(?:(?:private|confidential)\s+)?(?:initial\s+)?30-minute\s+(?:initial\s+|introductory\s+)?(?:Zoom\s+)?(?:call|conversation|consultation)(?:\s+by Zoom)?/gi, '15-minute Discovery Call')
    .replace(/\b(?:free\s+)?initial\s+(?:EMDR\s+)?(?:Zoom\s+)?(?:call|consultation|conversation)(?:\s+by Zoom)?/gi, 'Discovery Call')
    .replace(/free\s+(?:first|introductory)\s+(?:conversation|call)/gi, 'Discovery Call')
    .replace(/first session free/gi, 'Discovery Call - 15 mins')
    .replace(/Is (?:the )?(?:first therapy session|(?:15-minute )?Discovery Call) free\?/gi, 'What is a Discovery Call?')
    .replace(/during the free call/gi, 'during the Discovery Call')
    .replace(/free call with Brent/gi, 'Discovery Call with Brent')
    .replace(/Yes\. The 15-minute Discovery Call/gi, 'The 15-minute Discovery Call')
    .replace(/((?:15-minute )?Discovery Call(?: with Brent)?) is free and (?:is )?/gi, '$1 is ')
    .replace(/((?:15-minute )?Discovery Call(?: with Brent)?) is free\./gi, '$1 is a brief introductory conversation.')
    .replace(/free\s+(?:15-minute\s+)?Discovery Call/gi, '15-minute Discovery Call')
    .replace(/30-minute Discovery Call/gi, '15-minute Discovery Call');
}
