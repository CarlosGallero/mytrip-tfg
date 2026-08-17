export interface DestinationTravelInfo {
  destination_city: string;
  country_name: string;
  flag_emoji: string;
  currency: string;
  passport_required: boolean;
  passport_details: string;
  vaccination_required: boolean;
  vaccination_details: string;
  has_armed_conflict: boolean;
  conflict_details: string;
  origin_country: string;
}
