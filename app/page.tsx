import Link from "next/link";
import {
	HeroSection,
	TopPlayersSection,
	ContactSection,
	RankingsSection,
	EventsSection,
	EventsSectionErrorBoundary,
} from "@/components/sections";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Page() {
	return (
		<>
			<Header transparent={true} />

			<main>
				<HeroSection />
				<TopPlayersSection /> {/* This section causes an hydration error */}
				<RankingsSection /> {/* This section causes an hydration error */}
				<EventsSectionErrorBoundary>
					<EventsSection />
				</EventsSectionErrorBoundary>
				<ContactSection />
			</main>

			<Footer />
		</>
	);
}
