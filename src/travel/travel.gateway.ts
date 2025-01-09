import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TravelService } from './travel.service';
import { WeatherService } from 'src/weather/weather.service';
import { Logger } from '@nestjs/common';

interface UserSession {
  step: number;
  data: {
    destination?: string;
    dates?: string;
    interests?: string;
    weatherPreference?: string;
  };
}

interface TravelDates {
  start: string;
  end: string;
}

const QUESTIONS = [
  'What is your destination?',
  'What are your travel dates? (e.g., From December 25th to December 31st)',
  'What are your interests? (e.g., art, historical landmarks, food)',
  'What weather do you prefer? (e.g., sunny, mild temperatures)',
];

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/travel',
})
export class TravelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSessions: Record<string, UserSession> = {};
  private readonly logger = new Logger(TravelGateway.name);

  constructor(
    private readonly travelService: TravelService,
    private readonly weatherService: WeatherService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Travel WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    this.userSessions[client.id] = {
      step: 0,
      data: {},
    };

    client.emit('connected', { message: 'Welcome to the Travel Planner!' });
    this.askNextQuestion(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    delete this.userSessions[client.id];
  }

  private getSession(client: Socket): UserSession {
    const session = this.userSessions[client.id];
    if (!session) {
      this.logger.error(`Session not found for client: ${client.id}`);
      throw new Error(`Session not found for client: ${client.id}`);
    }
    this.logger.log(`Session retrieved for client: ${client.id}`);
    return session;
  }

  private askNextQuestion(client: Socket) {
    const session = this.getSession(client);

    if (session.step >= QUESTIONS.length) {
      this.processData(client);
      return;
    }

    const question = QUESTIONS[session.step];
    this.logger.log(`Asking question: ${question}`);
    client.emit('question', {
      questionNumber: session.step + 1,
      totalQuestions: QUESTIONS.length,
      question,
    });
  }

  @SubscribeMessage('answer')
  handleUserAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { data: string },
  ) {
    this.logger.log(
      `Received event: answer with data: ${JSON.stringify(payload)}`,
    );
    try {
      if (!client || !client.id) {
        throw new Error('Invalid socket connection');
      }

      const session = this.getSession(client);

      if (!payload || !payload.data || typeof payload.data !== 'string') {
        throw new Error('Invalid answer format. Expected { data: string }');
      }

      const answer = payload.data;
      const questionKeys = [
        'destination',
        'dates',
        'interests',
        'weatherPreference',
      ];
      const key = questionKeys[session.step];
      session.data[key] = answer.trim();

      this.logger.log(`Processed answer for "${key}": ${answer.trim()}`);

      session.step++;

      this.askNextQuestion(client);
    } catch (error) {
      this.logger.error(`Error handling answer: ${error.message}`);
      if (client && client.connected) {
        client.emit('error', {
          message: `Failed to process answer: ${error.message}`,
          code: 'ANSWER_PROCESSING_FAILED',
        });
      } else {
        this.logger.error('Could not emit error - client disconnected');
      }
    }
  }

  private async processData(client: Socket) {
    const session = this.getSession(client);

    try {
      client.emit('status', {
        message: 'Fetching weather data...',
        progress: 25,
      });

      const dates = this.parseDates(session.data.dates);
      if (!session.data.destination) {
        throw new Error('Destination is required');
      }

      const weatherData = await this.weatherService.getWeatherInfo(
        session.data.destination,
        dates.start,
        dates.end,
      );

      client.emit('status', {
        message: 'Generating itinerary...',
        progress: 75,
      });

      const itinerary = await this.travelService.generateItinerary({
        destination: session.data.destination,
        dates,
        interests:
          session.data.interests?.split(',').map((i) => i.trim()) || [],
        weatherPreference: session.data.weatherPreference,
        weatherData,
      });

      client.emit('itinerary', {
        success: true,
        data: itinerary,
        message: 'Itinerary generated successfully',
      });

      this.logger.log(
        `Itinerary generated successfully for client: ${client.id}`,
      );
      delete this.userSessions[client.id];
    } catch (error) {
      client.emit('error', {
        message: `Failed to generate itinerary: ${error.message}`,
        code: 'ITINERARY_GENERATION_FAILED',
      });

      this.logger.error(`Error processing data: ${error.message}`);
    }
  }

  private parseDates(dateString: string): TravelDates {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const match = dateString.match(/From\s(.+)\sto\s(.+)/i);
    if (!match) {
      throw new Error(
        'Invalid date format. Please provide dates in the format "From <start date> to <end date>".',
      );
    }

    const startDate = new Date(match[1]);
    const endDate = new Date(match[2]);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date values provided');
    }

    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }
}
