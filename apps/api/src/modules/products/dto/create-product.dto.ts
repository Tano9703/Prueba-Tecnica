import { IsArray, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  categoryId!: string;

  @IsString()
  brand!: string;

  @IsString()
  gender!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  options?: unknown[];
}
