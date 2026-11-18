/** 700 -> "7,00 €" (Slovenian: decimal comma, euro sign after the number). */
export function formatPrice(cents: number): string {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}
