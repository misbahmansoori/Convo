export function generateMeetingCode() {
  const segment = () =>
    Math.random().toString(36).substring(2, 5).toLowerCase();
  return `${segment()}-${segment()}-${segment()}`;
}

export function formatMeetingCode(code) {
  if (!code) return "Unknown";

  if (code.startsWith("http://") || code.startsWith("https://")) {
    try {
      const path = new URL(code).pathname.replace(/^\//, "");
      return path || code;
    } catch {
      return code;
    }
  }

  return code;
}

export function formatMeetingDateTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { date: "Unknown date", time: "" };
  }

  return {
    date: date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
