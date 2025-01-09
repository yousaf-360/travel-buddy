import { Module } from '@nestjs/common';
import { TravelService } from './travel.service';
import { TravelController } from './travel.controller';
import { TravelGateway } from './travel.gateway';
import { OpenaiModule } from 'src/openai/openai.module';
import { WeatherModule } from 'src/weather/weather.module';

@Module({
  imports:[OpenaiModule,WeatherModule],
  providers: [TravelService, TravelGateway],
  controllers: [TravelController]
})
export class TravelModule {}
