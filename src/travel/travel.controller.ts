import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TravelService } from './travel.service';
import { WeatherService } from '../weather/weather.service';

@Controller('travel')
export class TravelController {
  constructor(
    private readonly travelService: TravelService,
    private readonly weatherService: WeatherService,
  ) {}

  @Post('/itinerary')
  async generateItinerary(@Body() body: any) {
    const { destination, dates, interests, weatherPreference } = body;

    if (!destination || !dates || !dates.start || !dates.end || !interests || !weatherPreference) {
      throw new HttpException(
        'Missing required fields: destination, dates (start/end), interests, and weatherPreference',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Fetch weather data
      const weatherData = await this.weatherService.getWeatherInfo(
        destination,
        dates.start,
        dates.end,
      );

      // Generate the itinerary
      const itinerary = await this.travelService.generateItinerary({
        destination,
        dates,
        interests,
        weatherPreference,
        weatherData,
      });

      // Return the itinerary
      return { success: true, itinerary };
    } catch (error) {
      throw new HttpException(
        `Failed to generate itinerary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

