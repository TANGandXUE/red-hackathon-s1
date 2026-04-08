import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class StartSimulationDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  ideas: string[];
}
