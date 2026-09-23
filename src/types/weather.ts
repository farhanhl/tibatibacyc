export interface WeatherHourlyData {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
  wind_speed_10m: number[];
}

export interface OpenMeteoLocationResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: WeatherHourlyData;
}

export interface AirQualityHourlyData {
  time: string[];
  us_aqi: number[];
  pm2_5: number[];
}

export interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: AirQualityHourlyData;
}

export type CyclingConditionStatus = "ideal" | "caution" | "warning";
export type AirQualityLevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy";

export interface AirQualityInfo {
  aqi: number;
  pm2_5: number;
  level: AirQualityLevel;
  label: string;
  colorClass: string;
  badgeBg: string;
  recommendation: string;
}

export interface RegionWeatherInfo {
  regionName: string;
  landmark: string;
  temp: number;
  rainProb: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  airQuality: AirQualityInfo;
}

export interface WeekendDayWeather {
  dayLabel: "Sabtu Gowes" | "Minggu Gowes";
  dateFormatted: string;
  dateStr: string;
  overallStatus: CyclingConditionStatus;
  overallRecommendation: string;
  overallAqiLevel?: AirQualityLevel;
  overallAqiLabel?: string;
  regions: RegionWeatherInfo[];
}
