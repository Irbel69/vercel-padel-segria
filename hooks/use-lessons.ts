import { useEffect, useState } from "react";
import type { LessonSlot } from "@/types/lessons";

export function useLessonSlots(from?: string, to?: string) {
	const [slots, setSlots] = useState<LessonSlot[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let url = "/api/lessons/slots";
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		if (Array.from(params.keys()).length) url += `?${params.toString()}`;

		setLoading(true);
		fetch(url)
			.then((r) => r.json())
			.then((json) => setSlots(json.slots ?? []))
			.catch((e) => setError(e?.message ?? "Unknown error"))
			.finally(() => setLoading(false));
	}, [from, to]);

	return { slots, loading, error };
}
