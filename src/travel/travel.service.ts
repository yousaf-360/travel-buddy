import { Injectable } from '@nestjs/common';
import { OpenaiService } from 'src/openai/openai.service';

@Injectable()
export class TravelService {
  constructor(private readonly openAIService: OpenaiService) {}
  async generateItinerary(data: {
    destination: string;
    dates: { start: string; end: string };
    interests: string[];
    weatherPreference: string;
    weatherData: any;
  }): Promise<string> {
    const prompt = `
          You are an expert travel planning assistant. Using the details provided, create a detailed day-by-day itinerary for the user:
          
          Destination: ${data.destination}
          Travel Dates: From ${data.dates.start} to ${data.dates.end}
          User Interests: ${data.interests.join(', ')}
          Weather Preference: ${data.weatherPreference}
          Weather Forecast for the Destination:
          ${JSON.stringify(data.weatherData, null, 2)}
    
          Provide:
          - Day-by-day activities based on the user's interests and weather conditions.
          - Recommendations for meals or restaurants where applicable.
          - Group nearby attractions for efficient travel.
          - Allow flexibility for optional activities.
    
          Ensure the plan is exciting, well-organized, and user-friendly.
        `;

    try {
      const itinerary = await this.openAIService.generateResponse(prompt);
      return itinerary.trim();
    } catch (error) {
      throw new Error(`Failed to generate itinerary: ${error.message}`);
    }
  }
}
