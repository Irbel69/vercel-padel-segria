import Link from "next/link";
import {
  HeroSection,
  QuiSomSection,
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
        <div className="container px-4 mx-auto">
        <HeroSection />
          <QuiSomSection />
          <TopPlayersSection /> {/* This section causes an hydration error */}
          <RankingsSection showNavButtons={false} /> {/* This section causes an hydration error */}
          <EventsSectionErrorBoundary>
            <EventsSection />
          </EventsSectionErrorBoundary>
          <ContactSection />
      <Footer />
        </div>
      </main>

    </>
  );
}
