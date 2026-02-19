import { IsOptional, IsString } from "class-validator";

export class CategoriesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
