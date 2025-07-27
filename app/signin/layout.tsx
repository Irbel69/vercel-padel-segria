import { ReactNode } from "react";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
	title: `Àrea Personal - ${config.appName}`,
	description:
		"Accedeix al teu compte per gestionar les teves reserves i participar en tornejos",
	canonicalUrlRelative: "/signin",
});

export default function Layout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
