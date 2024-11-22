export type Battle = {
  id?: string;
  createdDate?: Date;
  aggressor: string;
  defender: string;
  attackingFromTerritory: string;
  defendingTerritory: string;
  aggressorInitialTroopCount?: number;
  defenderInitialTroopCount?: number;
  events?: { date: Date; defenderChange: number; aggressorChange: number }[];
};
