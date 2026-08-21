export interface EstimatedDailyCost {
  currency: string;
  total_daily_cost: number;
  food_daily_cost: number;
  activities_daily_cost: number;
  breakdown_details: string;
}

export interface DestinationTravelInfo {
  destination_city: string;
  country_name: string;
  flag_emoji: string;
  flag_image_url?: string | null;
  country_code?: string | null;
  currency: string;
  passport_required: boolean;
  passport_details: string;
  vaccination_required: boolean;
  vaccination_details: string;
  has_armed_conflict: boolean;
  conflict_details: string;
  origin_country: string;
  passport_application_url?: string | null;
  passport_authority_name?: string | null;
  passport_instructions?: string | null;
  estimated_daily_cost?: EstimatedDailyCost | null;
}

export interface TripWizardData {
  destination: string;
  countryInfo?: DestinationTravelInfo | null;
  hasPassport?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
  totalDays?: number;
  totalNights?: number;
  budget?: number | null;
  currency?: string;
  hasMobilityIssues?: boolean | null;
  healthConditions?: string[];
  dietaryPreferences?: string[];
}
