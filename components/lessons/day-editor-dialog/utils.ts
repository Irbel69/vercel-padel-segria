"use client";

export function formatTimeHHMM(d: Date) {
	return d.toTimeString().slice(0, 5);
}

export function minutesBetween(a: Date, b: Date) {
	return Math.round((b.getTime() - a.getTime()) / 60000);
}
