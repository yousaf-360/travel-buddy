import { Controller, Get, Param, Query } from '@nestjs/common';
import { WikiService } from './wiki.service';

@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  // Get page content by title
  @Get('content/:title')
  async getPageContent(@Param('title') title: string) {
    const decodedTitle = decodeURIComponent(title); // Decode the title
    return await this.wikiService.getPageContent(decodedTitle);
  }

  // Get page summary by title
  @Get('summary/:title')
  async getPageSummary(@Param('title') title: string) {
    const decodedTitle = decodeURIComponent(title); // Decode the title
    return await this.wikiService.getPageSummary(decodedTitle);
  }

  // Search for topics
  @Get('search')
  async searchTopics(@Query('query') query: string) {
    return await this.wikiService.searchTopics(query);
  }
}
