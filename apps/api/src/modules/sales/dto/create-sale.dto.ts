import { PaymentStatus, SaleStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @IsString()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total!: number;

  @IsEnum(SaleStatus)
  status!: SaleStatus;

  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsString()
  paymentMethod!: string;

  @IsString()
  shippingAddress!: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
