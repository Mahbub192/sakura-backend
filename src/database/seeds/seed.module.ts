import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role, User, Clinic } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Clinic])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}



