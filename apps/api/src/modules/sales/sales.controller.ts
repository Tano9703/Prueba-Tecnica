import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "../../common/interfaces/auth-user.interface";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { GenerateSaleDto } from "./dto/generate-sale.dto";
import { SalesQueryDto } from "./dto/sales-query.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";
import { UpdateSaleStatusDto } from "./dto/update-sale-status.dto";
import { SalesService } from "./sales.service";

@Controller("sales")
export class SalesController {
  constructor(@Inject(SalesService) private readonly salesService: SalesService) {}

  @Get()
  findAll(@Query() query: SalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @Req() req: Request & { user: AuthUser }) {
    return this.salesService.create(dto, req.user?.name);
  }

  @Post("generate")
  generate(@Body() dto: GenerateSaleDto = new GenerateSaleDto(), @Req() req: Request & { user: AuthUser }) {
    return this.salesService.generate(dto, req.user?.name);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSaleDto, @Req() req: Request & { user: AuthUser }) {
    return this.salesService.update(id, dto, req.user?.name);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateSaleStatusDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.salesService.updateStatus(id, dto, req.user?.name);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.salesService.remove(id);
  }
}
