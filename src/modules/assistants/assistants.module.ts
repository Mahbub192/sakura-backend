import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';
import { Assistant, Doctor, User, Role } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Assistant, Doctor, User, Role])],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
