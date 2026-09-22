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

export type CyclingConditionStatus = "ideal" | "caution" | "warning";

export interface RegionWeatherInfo {
  regionName: string;
  landmark: string;
  temp: number;
  rainProb: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
}

export interface WeekendDayWeather {
  dayLabel: "Sabtu Gowes" | "Minggu Gowes";
  dateFormatted: string;
  dateStr: string;
  overallStatus: CyclingConditionStatus;
  overallRecommendation: string;
  regions: RegionWeatherInfo[];
}
