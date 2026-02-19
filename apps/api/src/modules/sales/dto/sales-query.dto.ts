import { IsOptional, IsString } from "class-validator";

export class SalesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
