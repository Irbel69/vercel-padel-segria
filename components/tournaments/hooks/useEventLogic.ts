import type { Event } from "@/types";

export function useEventLogic() {
  const canRegister = (event: Event) => {
    const registrationDeadline = new Date(event.registration_deadline);
    const now = new Date();
    return (
      event.status === "open" &&
      registrationDeadline > now &&
      (event.current_participants || 0) < event.max_participants &&
      !event.user_registration_status
    );
  };

  const canUnregister = (event: Event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return event.user_registration_status === "confirmed" && hoursUntilEvent >= 24;
  };

  const isRegistrationUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  };

  const getShortLocation = (location: string) => {
    if (!location) return "";
    const parts = location.split(",");
    if (parts.length >= 3) {
      return parts[1]?.trim() || parts[0]?.trim();
    }
    return parts[0]?.trim();
  };

  return { canRegister, canUnregister, isRegistrationUrgent, getShortLocation } as const;
}
