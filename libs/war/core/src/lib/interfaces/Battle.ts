export type Battle = {
  id?: string;
  createdDate?: string;
  aggressor: string;
  defender: string;
  attackingFromTerritory: string;
  defendingTerritory: string;
  aggressorInitialTroopCount?: number;
  defenderInitialTroopCount?: number;
  events?: { date: string; defenderChange: number; aggressorChange: number }[];
};
