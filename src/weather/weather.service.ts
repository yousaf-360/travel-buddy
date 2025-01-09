import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeatherInfo(
    cityName: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
      const geoResponse = await lastValueFrom(this.httpService.get(geoApiUrl));

      if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
        throw new Error('City not found');
      }

      const latitude = geoResponse.data.results[0].latitude.toString();
      const longitude = geoResponse.data.results[0].longitude.toString();

      const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=rain,showers,snowfall,weather_code&hourly=temperature_2m,precipitation,rain,snowfall&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
      const weatherResponse = await lastValueFrom(
        this.httpService.get(weatherApiUrl)
      );
      return weatherResponse.data;
    } catch (error) {
      throw new Error(error);
    }
  }
}
