import Link from "next/link";
import {
	HeroSection,
	TopPlayersSection,
	ContactSection,
	RankingsSection,
} from "@/components/sections";
import Header from "@/components/Header";

export default function Page() {
	return (
		<>
			<Header transparent={true} />

			<main>
				<HeroSection />
				<TopPlayersSection /> {/* This section causes an hydration error */}
				<RankingsSection /> {/* This section causes an hydration error */}
				<ContactSection />
			</main>
		</>
	);
}
