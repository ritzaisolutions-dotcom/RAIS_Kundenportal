export function cn(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
