"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import config from "@/config";

const links: { href: string; label: string }[] = [
  { href: "#hero", label: "Inici" },
  { href: "#top-players", label: "Top Players" },
  { href: "#rankings", label: "Classificació" },
  { href: "#events", label: "Propers Tornejos" },
  { href: "#contact", label: "Contacta" },
];

// Define the Login button component
const LoginButton = ({
  isHomePage,
  transparent,
}: {
  isHomePage?: boolean;
  transparent?: boolean;
}) => (
  <Link
    href="/signin"
    className={`${
      isHomePage || transparent
        ? "bg-padel-primary text-black hover:bg-white"
        : "btn btn-primary"
    } font-bold px-3 lg:px-4 xl:px-6 py-2 rounded-md flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm xl:text-base`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-4 h-4 lg:w-5 lg:h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275"
      />
    </svg>
    <span className="hidden sm:inline lg:inline">Àrea Personal</span>
    <span className="sm:hidden lg:hidden">Àrea</span>
  </Link>
);

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
interface HeaderProps {
  transparent?: boolean;
}

// Header content component that uses useSearchParams
const HeaderContent = ({ transparent = false }: HeaderProps) => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const path = searchParams.toString();
  const isHomePage = path === "";

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Detect scroll position to change header background - throttled for better mobile performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          if (scrollPosition > 20) {
            setHasScrolled(true);
          } else {
            setHasScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`${
          isHomePage || transparent
            ? "sticky top-0 backdrop-blur-sm transition-all duration-300"
            : "sticky top-0 z-40 bg-base-200/95 backdrop-blur-md  md:bg-base-200 md:static"
        } ${
          // Add background on scroll or when not homepage
          isHomePage || transparent
            ? hasScrolled
              ? "bg-black/80"
              : "bg-transparent"
            : ""
        }`}
      >
        <nav
          className="container flex items-center justify-between px-8 py-4 mx-auto transition-all duration-300"
          aria-label="Global"
        >
          {/* Your logo/name on large screens */}
          <div className="flex lg:flex-1">
            <Link
              className="flex items-center gap-2 shrink-0"
              href="/"
              title={`${config.appName} homepage`}
            >
              <Image
                src="/logo_yellow.png"
                alt={`${config.appName} logo`}
                className="w-10 h-10"
                priority={true}
                width={40}
                height={40}
              />
              <span className="font-extrabold text-lg text-padel-primary">
                Padel Segrià
              </span>
            </Link>
          </div>
          {/* Burger button to open/close menu on mobile - animated */}
          <div className="flex lg:hidden">
            <button
              type="button"
              aria-label="Toggle main menu"
              className={`relative inline-flex items-center justify-center rounded-md w-10 h-10 transition-colors ${
                isHomePage || transparent || isOpen
                  ? "text-white"
                  : "text-base-content"
              }`}
              onClick={() => setIsOpen((v) => !v)}
            >
              {/* Animated hamburger -> cross */}
              <span
                aria-hidden
                className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? "rotate-45" : "-translate-y-2"
                }`}
              />
              <span
                aria-hidden
                className={`block h-0.5 w-6 bg-current transition-opacity duration-300 ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                aria-hidden
                className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                  isOpen ? "-rotate-45" : "translate-y-2"
                }`}
              />
            </button>
          </div>

          {/* Your links on large screens */}
          <div className="hidden lg:flex lg:justify-center lg:gap-4 lg:items-center lg:flex-1">
            {links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                className={`text-xs xl:text-sm font-medium whitespace-nowrap ${
                  isHomePage || transparent || isOpen
                    ? "text-white hover:text-padel-primary"
                    : "hover:text-padel-primary"
                } transition-colors`}
                title={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Login button on large screens */}
          <div className="hidden lg:flex lg:justify-end lg:flex-1">
            <LoginButton isHomePage={isHomePage} transparent={transparent} />
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay sits UNDER the header to avoid layout shift */}
      <div className={`fixed inset-0 z-40 ${isOpen ? "" : "hidden"}`}>
        {/* Backdrop with dotted pattern and blur effect */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(229, 240, 0, 0.1) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
          onClick={() => setIsOpen(false)}
        />

        {/* Mobile menu panel */}
        <div
          className="fixed inset-y-0 -top-[calc(env(safe-area-inset-top)+4rem)] right-0 z-[9999] w-full sm:max-w-sm h-screen overflow-y-auto transform origin-right transition-all ease-in-out duration-500 mobile-sidebar-safe"
          style={{
            height: "100vh",
            paddingTop: "calc(env(safe-area-inset-top) + 72px)",
            paddingBottom: "env(safe-area-inset-bottom)",
            background: `linear-gradient(135deg, rgba(5, 28, 44, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(229, 240, 0, 0.2)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 100px rgba(229, 240, 0, 0.05)",
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 -right-20 w-40 h-40 bg-padel-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-40 -left-20 w-32 h-32 bg-padel-primary/10 rounded-full blur-2xl" />
            <div className="absolute top-1/2 right-10 w-2 h-2 bg-padel-primary/30 rounded-full animate-pulse" />
            <div
              className="absolute top-1/3 right-20 w-1 h-1 bg-padel-primary/40 rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-1/3 right-6 w-1.5 h-1.5 bg-padel-primary/20 rounded-full animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>

          <div className="relative z-10 p-6 h-full flex flex-col mobile-sidebar-content-safe">
            {/* Space reserved for the shared header (logo + hamburger) */}
            <div className="mb-6" />

            {/* Navigation Links */}
            <div className="space-y-6 mb-12">
              {links.map((link, index) => (
                <Link
                  href={link.href}
                  key={link.href}
                  className="group relative block"
                  title={link.label}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className="relative p-4 rounded-2xl transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {/* Hover/active background effect (desktop hover, mobile active) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-padel-primary/10 to-padel-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-300" />

                    {/* Subtle left accent bar for touch feedback */}
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded bg-padel-primary/70 opacity-0 active:opacity-100 group-focus-within:opacity-100 sm:group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Link content */}
                    <div className="relative flex items-center gap-4">
                      <div className="w-2 h-2 bg-padel-primary/50 rounded-full group-hover:bg-padel-primary group-hover:scale-150 transition-all duration-300" />
                      <span className="text-xl font-semibold text-white group-hover:text-padel-primary transition-colors duration-300">
                        {link.label}
                      </span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 text-padel-primary"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Divider with gradient */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full border-t border-gradient-to-r from-transparent via-padel-primary/30 to-transparent"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(229, 240, 0, 0.3), transparent)`,
                    height: "1px",
                  }}
                />
              </div>
              <div className="relative flex justify-center">
                <div className="px-4 bg-black/50 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-padel-primary/60 rounded-full" />
                </div>
              </div>
            </div>

            {/* Login Button - Enhanced */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-padel-primary/20 to-padel-primary/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <Link
                  href="/signin"
                  className="relative block w-full p-6 rounded-2xl text-center font-bold text-xl transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, rgba(229, 240, 0, 0.9) 0%, rgba(229, 240, 0, 1) 100%)`,
                    color: "#051c2c",
                    boxShadow: "0 10px 30px rgba(229, 240, 0, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                      />
                    </svg>
                    <span>Àrea Personal</span>
                  </div>
                </Link>
              </div>

              {/* Additional Menu Options removed as requested (Contact & Dashboard) */}
            </div>

            {/* Footer info */}
            <div
              className="mt-12 pt-6 text-center"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <p className="text-sm text-gray-400">© 2025 Padel Segrià</p>
              <p className="text-xs text-gray-500 mt-1">
                Lleu, Competeix, Guanya
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main Header component with Suspense boundary
const Header = ({ transparent = false }: HeaderProps) => {
  return (
    <Suspense
      fallback={
        <header
          className={`${
            transparent
              ? "fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm"
              : "bg-base-200"
          }`}
        >
          <nav className="container flex items-center justify-between px-8 py-4 mx-auto">
            <div className="flex lg:flex-1">
              <Link
                className="flex items-center gap-2 shrink-0"
                href="/"
                title={`${config.appName} homepage`}
              >
                <Image
                  src="/logo_yellow.png"
                  alt={`${config.appName} logo`}
                  className="w-10 h-10"
                  priority={true}
                  width={40}
                  height={40}
                />
                <span className="font-extrabold text-lg text-padel-primary">
                  Padel Segrià
                </span>
              </Link>
            </div>
          </nav>
        </header>
      }
    >
      <HeaderContent transparent={transparent} />
    </Suspense>
  );
};

export default Header;
