import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class WikiService {
  private readonly apiUrl = 'https://en.wikipedia.org/w/api.php'; // MediaWiki Action API
  private readonly restApiUrl = 'https://en.wikipedia.org/api/rest_v1'; // Wikimedia REST API

  // Fetch page content using the MediaWiki API
  async getPageContent(title: string): Promise<string | null> {
    try {
      const response: AxiosResponse = await axios.get(this.apiUrl, {
        params: {
          action: 'query',
          format: 'json',
          titles: title, // Do not encode
          prop: 'extracts',
          explaintext: 1, // Plain text output
          origin: '*',
        },
      });

      const pages = response.data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1') {
          return pages[pageId].extract; // Extract plain text content
        } else {
          return null; // Page not found
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching Wikipedia page content:', error);
      throw error;
    }
  }

  // Fetch a page summary using the Wikimedia REST API
  async getPageSummary(title: string): Promise<any | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.restApiUrl}/page/summary/${title}`, {
        params: {
          origin: '*',
        },
      });
      return response.data; // Return the summary JSON
    } catch (error) {
      console.error('Error fetching Wikipedia page summary:', error);
      return null;
    }
  }

  // Perform a general search using the MediaWiki API
  async searchTopics(query: string): Promise<any | null> {
    try {
      const response: AxiosResponse = await axios.get(this.apiUrl, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query, // Search query
          format: 'json',
          origin: '*',
        },
      });
      return response.data.query?.search || []; // Return search results
    } catch (error) {
      console.error('Error searching Wikipedia topics:', error);
      return null;
    }
  }
}
