"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search, Users, Crown, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserProfile, UsersListResponse } from "@/types";

export default function UsersPage() {
	const { user, profile, isLoading: userLoading } = useUser();
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [pagination, setPagination] = useState<UsersListResponse['pagination'] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

	// Redirect if not admin
	useEffect(() => {
		if (!userLoading && (!profile || !profile.is_admin)) {
			redirect("/dashboard");
		}
	}, [profile, userLoading]);

	const fetchUsers = async (page: number = 1, searchTerm: string = "") => {
		try {
			setIsLoading(true);
			setError(null);

			const params = new URLSearchParams({
				page: page.toString(),
				limit: "10",
			});

			if (searchTerm) {
				params.append("search", searchTerm);
			}

			const response = await fetch(`/api/admin/users?${params}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error carregant els usuaris");
			}

			const typedData = data as UsersListResponse;
			setUsers(typedData.users);
			setPagination(typedData.pagination);
		} catch (err) {
			console.error("Error fetching users:", err);
			setError(err instanceof Error ? err.message : "Error desconegut");
		} finally {
			setIsLoading(false);
		}
	};

	// Handle search with debounce
	useEffect(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		const timeout = setTimeout(() => {
			setCurrentPage(1);
			fetchUsers(1, search);
		}, 500);

		setSearchTimeout(timeout);

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [search]);

	// Initial load
	useEffect(() => {
		if (profile?.is_admin) {
			fetchUsers(currentPage, search);
		}
	}, [profile?.is_admin, currentPage]);

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
		fetchUsers(newPage, search);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ca-ES", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getInitials = (name: string | null, surname: string | null) => {
		return `${name?.charAt(0) || ""}${surname?.charAt(0) || ""}`.toUpperCase() || "U";
	};

	// Show loading while checking user permissions
	if (userLoading || (!profile?.is_admin && !error)) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-padel-primary/20 rounded-lg">
						<Users className="h-6 w-6 text-padel-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white">Gestió d'Usuaris</h1>
						<p className="text-white/60">
							Administra tots els usuaris registrats a la plataforma
						</p>
					</div>
				</div>
			</div>

			{/* Search */}
			<Card className="bg-white/5 border-white/10">
				<CardContent className="p-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
						<Input
							placeholder="Cerca per nom, cognom o email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Error Message */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Users List */}
			<Card className="bg-white/5 border-white/10">
				<CardHeader>
					<CardTitle className="text-white flex items-center justify-between">
						<span>Usuaris Registrats</span>
						{pagination && (
							<Badge variant="secondary" className="bg-padel-primary/20 text-padel-primary">
								{pagination.totalUsers} usuaris
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center space-x-4">
									<Skeleton className="h-12 w-12 rounded-full" />
									<div className="space-y-2 flex-1">
										<Skeleton className="h-4 w-[250px]" />
										<Skeleton className="h-4 w-[200px]" />
									</div>
								</div>
							))}
						</div>
					) : users.length === 0 ? (
						<div className="text-center py-8">
							<Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
							<p className="text-white/60">
								{search ? "No s'han trobat usuaris" : "No hi ha usuaris registrats"}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{users.map((userData) => (
								<div
									key={userData.id}
									className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
									<Avatar className="h-12 w-12">
										<AvatarImage src={userData.avatar_url || ""} />
										<AvatarFallback className="bg-padel-primary/20 text-padel-primary">
											{getInitials(userData.name, userData.surname)}
										</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<p className="text-white font-medium truncate">
												{userData.name && userData.surname
													? `${userData.name} ${userData.surname}`
													: userData.email}
											</p>
											{userData.is_admin && (
												<Crown className="h-4 w-4 text-yellow-500" />
											)}
										</div>
										<p className="text-white/60 text-sm truncate">{userData.email}</p>
										{userData.phone && (
											<p className="text-white/40 text-xs">{userData.phone}</p>
										)}
									</div>

									<div className="text-right space-y-1">
										<div className="flex items-center gap-2">
											<Badge
												variant={userData.is_admin ? "default" : "secondary"}
												className={
													userData.is_admin
														? "bg-yellow-500/20 text-yellow-400"
														: "bg-white/10 text-white/70"
												}>
												{userData.is_admin ? "Admin" : "Usuari"}
											</Badge>
										</div>
										<p className="text-white/40 text-xs">
											Registrat: {formatDate(userData.created_at)}
										</p>
										<div className="text-white/60 text-xs">
											Puntuació: {userData.score} | Partits: {userData.matches_played}
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Pagination */}
					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
							<p className="text-white/60 text-sm">
								Pàgina {pagination.currentPage} de {pagination.totalPages}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(pagination.currentPage - 1)}
									disabled={pagination.currentPage === 1}
									className="bg-white/10 border-white/20 text-white hover:bg-white/20">
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(pagination.currentPage + 1)}
									disabled={!pagination.hasMore}
									className="bg-white/10 border-white/20 text-white hover:bg-white/20">
									Següent
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
