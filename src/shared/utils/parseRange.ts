export function parseRange(value: string): { min: number; max: number | null } {
  if (value.endsWith("+")) {
    // Handle "28+" as min=28, max=null
    const min = parseInt(value.replace("+", "").trim(), 10);
    return { min, max: null };
  } else if (value.includes("-")) {
    // Handle "0-15" as min=0, max=15
    const [min, max] = value.split("-").map((v) => parseInt(v.trim(), 10));
    return { min, max };
  }
  return { min: parseInt(value, 10), max: parseInt(value, 10) }; // Single value fallback
}
