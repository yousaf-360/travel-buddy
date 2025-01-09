import { Module } from '@nestjs/common';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';
import {HttpModule} from '@nestjs/axios';
@Module({
  imports:[HttpModule],
  providers: [WikiService],
  controllers: [WikiController]
})
export class WikiModule {}
