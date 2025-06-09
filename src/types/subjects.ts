export type Difficulty = "easy" | "medium" | "hard";

export interface Subject {
  id: string;
  subject_name: string;
  credits: number;
  study_cycle_id: string;
  difficulty: Difficulty;
}
