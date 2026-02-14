import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, IsString } from 'class-validator';

export class CreateEventsDto {
  @ApiProperty({ description: 'title', required: true })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'date', required: true })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'totalTickets', required: true })
  @IsInt()
  totalTickets: number;

  @ApiProperty({ description: 'createdById', required: true })
  @IsString()
  createdById: string;
}
