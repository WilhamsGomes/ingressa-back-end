import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com', required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', required: true })
  @IsString()
  @MinLength(6)
  password: string;
}
