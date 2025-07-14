import Link from "next/link";
import { HeroSection } from "@/components/sections";
import Header from "@/components/Header";

export default function Page() {
	return (
		<>
			<Header transparent={true} />

			<main>
				<HeroSection />

				{/* Additional sections will be added here */}
				<section className="py-24 bg-white">
					<div className="container mx-auto px-4 text-center">
						<h2 className="text-2xl font-bold text-padel-secondary mb-4">
							Ready to start your padel journey?
						</h2>
						<p className="text-gray-600 mb-8">
							Join thousands of players competing in tournaments across Segrià.
						</p>
						<Link href="/blog" className="text-padel-primary hover:underline">
							Learn more about our tournaments
						</Link>
					</div>
				</section>
			</main>
		</>
	);
}
