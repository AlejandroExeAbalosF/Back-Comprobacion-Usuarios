import {
  Body,
  Controller,
  Get,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pdf/planilla-mes')
  @UsePipes(new ValidationPipe({ transform: true })) // Convierte los valores a números automáticamente
  async generatePDFplanillaMes(
    @Res() res: Response,
    @Query() query: CreateReportDto,
  ) {
    const { year, month } = query;
    const pdfBuffer = await this.reportsService.generatePDFplanillaMes(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="planilla-${year}-${month}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
