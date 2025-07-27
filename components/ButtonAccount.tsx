/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useUser } from "@/hooks/use-user";

// A button to show user account actions
// 1. Logout: sign out and go back to homepage
const ButtonAccount = () => {
	const { user, profile, signOut } = useUser();

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	const displayName = profile
		? `${profile.name} ${profile.surname}`
		: user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";

	const displayInitial =
		profile?.name?.charAt(0) || user?.email?.charAt(0) || "A";

	return (
		<Popover className="relative z-10">
			{({ open }) => (
				<>
					<Popover.Button className="btn">
						{user?.user_metadata?.avatar_url || profile?.avatar_url ? (
							<img
								src={profile?.avatar_url || user?.user_metadata?.avatar_url}
								alt={"Profile picture"}
								className="w-6 h-6 rounded-full shrink-0"
								referrerPolicy="no-referrer"
								width={24}
								height={24}
							/>
						) : (
							<span className="w-8 h-8 bg-base-100 flex justify-center items-center rounded-full shrink-0 capitalize">
								{displayInitial}
							</span>
						)}

						{displayName}

						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className={`w-5 h-5 duration-200 opacity-50 ${
								open ? "transform rotate-180 " : ""
							}`}>
							<path
								fillRule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clipRule="evenodd"
							/>
						</svg>
					</Popover.Button>
					<Transition
						enter="transition duration-100 ease-out"
						enterFrom="transform scale-95 opacity-0"
						enterTo="transform scale-100 opacity-100"
						leave="transition duration-75 ease-out"
						leaveFrom="transform scale-100 opacity-100"
						leaveTo="transform scale-95 opacity-0">
						<Popover.Panel className="absolute left-0 z-10 mt-3 w-screen max-w-[16rem] transform">
							<div className="overflow-hidden rounded-xl shadow-xl ring-1 ring-base-content ring-opacity-5 bg-base-100 p-1">
								<div className="space-y-0.5 text-sm">
									{profile && (
										<div className="px-4 py-2 border-b border-base-300">
											<p className="font-medium">
												{profile.name} {profile.surname}
											</p>
											<p className="text-xs opacity-60">{user?.email}</p>
											{profile.is_admin && (
												<span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
													Administrador
												</span>
											)}
										</div>
									)}
									<button
										className="flex items-center gap-2 hover:bg-error/20 hover:text-error duration-200 py-1.5 px-4 w-full rounded-lg font-medium"
										onClick={handleSignOut}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5">
											<path
												fillRule="evenodd"
												d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
												clipRule="evenodd"
											/>
											<path
												fillRule="evenodd"
												d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
												clipRule="evenodd"
											/>
										</svg>
										Tancar Sessió
									</button>
								</div>
							</div>
						</Popover.Panel>
					</Transition>
				</>
			)}
		</Popover>
	);
};

export default ButtonAccount;
