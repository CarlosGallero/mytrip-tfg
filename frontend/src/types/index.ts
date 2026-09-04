export interface EstimatedDailyCost {
  currency: string;
  total_daily_cost: number;
  food_daily_cost: number;
  activities_daily_cost: number;
  breakdown_details: string;
}

export interface TransportInfo {
  how_to_arrive: string;
  local_mobility: string;
  price_variation_factors: string;
  estimated_range: string;
}

export interface AccommodationInfo {
  average_price_per_night: string;
  category_breakdown: string;
  seasonal_variation: string;
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
  transport_info?: TransportInfo | null;
  accommodation_info?: AccommodationInfo | null;
}

export type TripPaceLevel = 'relaxed' | 'moderate' | 'intense';

export interface DayPaceConfig {
  dayNumber: number;
  dateStr: string;
  pace: TripPaceLevel;
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
  interests?: string[];
  customInterests?: string[];
  specificPlaces?: string[];
  paceType?: 'global' | 'custom_days';
  globalPace?: TripPaceLevel;
  dailyPace?: DayPaceConfig[];
}

export interface ItineraryActivity {
  time_slot: 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'night' | string;
  time_range: string;
  title: string;
  type: 'activity' | 'restaurant' | 'monument' | 'culture' | 'beach' | 'leisure' | string;
  description: string;
  estimated_cost: number;
  currency: string;
  address: string;
  maps_url: string;
  image_url?: string | null;
  selection_reasons: string[];
}

export interface ItineraryDay {
  day_number: number;
  date: string;
  day_of_week: string;
  zone_name: string;
  daily_estimated_cost: number;
  pace: string;
  slots: ItineraryActivity[];
}

export interface TripResponse {
  id: string;
  user_id: string;
  destination: string;
  destination_city: string;
  country_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_nights: number;
  total_budget: number;
  total_estimated_cost: number;
  currency: string;
  has_mobility_issues: boolean;
  health_conditions: string[];
  dietary_preferences: string[];
  interests: string[];
  specific_places: string[];
  pace_type: string;
  global_pace: string;
  days: ItineraryDay[];
  created_at: string;
  updated_at: string;
}

export interface GenerateTripRequest {
  destination: string;
  country_name?: string | null;
  origin_country?: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  total_nights: number;
  budget: number;
  currency?: string;
  has_mobility_issues?: boolean | null;
  health_conditions?: string[];
  dietary_preferences?: string[];
  interests?: string[];
  custom_interests?: string[];
  specific_places?: string[];
  pace_type?: string;
  global_pace?: string;
  daily_pace?: DayPaceConfig[];
}
