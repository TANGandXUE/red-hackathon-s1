import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Simulation } from './entities/simulation.entity';
import { Message } from './entities/message.entity';
import { Result } from './entities/result.entity';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Simulation, Message, Result])],
  controllers: [SimulationController],
  providers: [SimulationService],
})
export class SimulationModule {}
