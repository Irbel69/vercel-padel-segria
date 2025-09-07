export interface Season {
  id: number;
  name: string;
  date_start: string;
  date_end: string;
  enrollments_open: boolean;
  timezone: string;
}

export interface Entry {
  id: number;
  day_of_week: number;
  kind: 'class' | 'break';
  start_time: string;
  end_time: string;
  capacity: number | null;
  location: string;
}
