import { SaleStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateSaleStatusDto {
  @IsEnum(SaleStatus)
  status!: SaleStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
