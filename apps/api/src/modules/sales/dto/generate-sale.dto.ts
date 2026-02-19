import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export enum PaymentSimulationResult {
  APPROVED = "APPROVED",
  DECLINED = "DECLINED",
  PENDING = "PENDING",
  RANDOM = "RANDOM",
}

export enum PriceAdjustmentType {
  DISCOUNT = "DISCOUNT",
  SURCHARGE = "SURCHARGE",
}

export class GenerateSaleItemAttributeDto {
  @IsString()
  name!: string;

  @IsString()
  value!: string;
}

export class GenerateSaleItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateSaleItemAttributeDto)
  attributes?: GenerateSaleItemAttributeDto[];
}

export class GenerateSaleDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GenerateSaleItemDto)
  items?: GenerateSaleItemDto[];

  @IsOptional()
  @IsEnum(PriceAdjustmentType)
  adjustmentType?: PriceAdjustmentType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  adjustmentPercent?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentSimulationResult)
  paymentSimulation?: PaymentSimulationResult;
}
