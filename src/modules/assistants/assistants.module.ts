import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';
import { Assistant, Doctor } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Assistant, Doctor])],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
