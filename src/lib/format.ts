export function formatPrice(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

const KNOWN_COUNTRY_CODES: Record<string, string> = {
  "Great Britain": "GB",
};

export function countryCode(country: string): string {
  return (
    KNOWN_COUNTRY_CODES[country] ??
    country
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 3)
  );
}
