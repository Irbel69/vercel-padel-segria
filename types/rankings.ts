export interface RankingPlayer {
  id: string;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  // Last 5 match results, most recent first. 'W' = win, 'L' = loss
  recent_form: ('W' | 'L')[];
  // Optional lightweight aggregates for dashboard presentation
  matches_played?: number;
  matches_won?: number;
  total_points: number;
  ranking_position: number;
}

export interface RankingsResponse {
  players: RankingPlayer[];
  // When a userId is provided to the endpoint and the user is not present in the
  // current page, the API will return up to 3 extra rows providing context:
  // [current user, immediate superior, immediate inferior]
  contextRows?: RankingPlayer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPlayers: number;
    hasMore: boolean;
    limit: number;
  };
}
