// Invented business details for the demo. Swap them for another client.

export const SITE = {
  name: "Pečka",
  slogan: "Iz tvojih rok v našo peč.",
  address: "Pekarska ulica 7, 2250 Ptuj",
  /** Not a real number, so it is shown as plain text, never as a tel: link. */
  phone: "02 000 00 00",
  hours: [
    { days: "torek do nedelja", time: "15.00–22.00" },
    { days: "ponedeljek", time: "zaprto" },
  ],
} as const;
