export const dynamic = "force-dynamic";
import UserCalendarView from "@/components/lessons/UserCalendarView";
import UpcomingBookingsList from "@/components/lessons/UpcomingBookingsList";
import LessonsHeader from "@/components/lessons/LessonsHeader";

export default function LessonsPage() {
	return (
		<div className="space-y-4 md:space-y-6 overflow-x-hidden">
			<LessonsHeader
				title="Gestió de Classes"
				subtitle="Calendari i reserves"
			/>

			<UserCalendarView />

			<div className="mt-2 md:mt-4">
				<h2 className="text-lg font-semibold text-white mb-2">
					Les meves reserves
				</h2>
				<UpcomingBookingsList />
			</div>
		</div>
	);
}
