export function formatTimeHHMM(dateValue) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
