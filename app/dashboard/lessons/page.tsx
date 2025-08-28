export const dynamic = "force-dynamic";
import UserCalendarView from "@/components/lessons/UserCalendarView";
import UpcomingBookingsList from "@/components/lessons/UpcomingBookingsList";

export default function LessonsPage() {
	return (
		<div className="space-y-4 overflow-x-hidden">
			<h1 className="text-2xl font-bold text-white">Classes</h1>
			<UserCalendarView />
			<div className="mt-6">
				<h2 className="text-lg font-semibold text-white mb-2">
					Les meves reserves
				</h2>
				<UpcomingBookingsList />
			</div>
		</div>
	);
}
