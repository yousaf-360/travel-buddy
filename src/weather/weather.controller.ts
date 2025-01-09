import { Controller, Get, Param, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('/')
  async getWeather(
    @Query('cityName') cityName: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      if (!startDate || !endDate) {
        return { error: 'Both start_date and end_date are required' };
      }
      return await this.weatherService.getWeatherInfo(cityName, startDate, endDate);
    } catch (error) {
      return { error: error.message };
    }
  }
}
