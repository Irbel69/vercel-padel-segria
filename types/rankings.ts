export interface RankingPlayer {
  id: string;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  trend: 'up' | 'down' | 'same';
  matches_played: number;
  matches_won: number;
  total_points: number;
  ranking_position: number;
}

export interface RankingsResponse {
  players: RankingPlayer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPlayers: number;
    hasMore: boolean;
    limit: number;
  };
}
