// The classes of "Berlin um 1900" (field klassenname) as the map tools number them.
export const CLASSES = ["yard", "street", "building", "public", "water", "green", "rail"] as const;
export const AISBER: Record<string, number> = {
  "Straßen und Plätze": 1,
  "gewerbliche und private Gebäude, Wohnbebauung": 2,
  "öffentliche Gebäude": 3,
  "Gewässer": 4,
  "Grünanlagen": 5,
  "Bahnanlagen": 6,
};
