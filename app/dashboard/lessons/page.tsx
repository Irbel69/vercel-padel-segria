export const dynamic = "force-dynamic";
import { ScheduleGrid } from "@/components/lessons/ScheduleGrid";

export default function LessonsPage() {
	const now = new Date();
	const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const to = new Date(from);
	to.setDate(from.getDate() + 7);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold text-white">Classes</h1>
			<ScheduleGrid fromISO={from.toISOString()} toISO={to.toISOString()} />
		</div>
	);
}
