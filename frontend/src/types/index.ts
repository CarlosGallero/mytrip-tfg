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
}
