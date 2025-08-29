export function useDateFormatting() {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return { formatDate, formatDateTime } as const;
}
