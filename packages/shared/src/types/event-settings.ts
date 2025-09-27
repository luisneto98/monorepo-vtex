export interface MultilingualText {
  pt: string;
  en: string;
  es: string;
}

export interface VenueInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp?: string;
}

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface EventSettings {
  _id?: string;
  eventName: MultilingualText;
  startDate: Date | string;
  endDate: Date | string;
  venue: VenueInfo;
  contact: ContactInfo;
  socialMedia?: SocialMediaLinks;
  mapCoordinates: MapCoordinates;
  updatedAt?: Date | string;
  updatedBy?: string;
}