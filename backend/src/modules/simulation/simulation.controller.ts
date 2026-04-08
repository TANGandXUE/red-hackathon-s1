import { Controller, Post, Get, Param, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SimulationService } from './simulation.service';
import { StartSimulationDto } from './dto/start-simulation.dto';

interface MessageEvent {
  data: string;
}

@Controller('api/simulation')
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  @Post('start')
  start(@Body() dto: StartSimulationDto) {
    return this.simulationService.startSimulation(dto.ideas);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.simulationService.getStream(id);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.simulationService.getStatus(id);
  }

  @Get(':id/result')
  result(@Param('id') id: string) {
    return this.simulationService.getResult(id);
  }
}
