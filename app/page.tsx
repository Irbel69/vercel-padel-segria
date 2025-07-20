import Link from "next/link";
import {
	HeroSection,
	TopPlayersSection,
	ContactSection,
	RankingsSection,
	EventsSection,
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
				<EventsSection />
				<ContactSection />
			</main>

			<Footer />
		</>
	);
}
