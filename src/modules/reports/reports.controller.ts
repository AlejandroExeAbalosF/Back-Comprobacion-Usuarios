import {
  Body,
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(AuthGuard)
  @Get('pdf/planilla-mes')
  @UsePipes(new ValidationPipe({ transform: true })) // Convierte los valores a números automáticamente
  async generatePDFplanillaMes(
    @Res() res: Response,
    @Query() query: CreateReportDto,
  ) {
    const { year, month } = query;
    const { name, pdfBuffer } =
      await this.reportsService.generatePDFplanillaMes(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="planilla-${name}-${year}-${month}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @UseGuards(AuthGuard)
  @Get('pdf/porcentaje-mes')
  // @UsePipes(new ValidationPipe({ transform: true })) // Convierte los valores a números automáticamente
  async generatePDFporcentajeMes(
    @Res() res: Response,
    @Query() query: CreateReportDto,
  ) {
    // @Query() query: CreateReportDto, // @Res() res: Response,
    const { year, month } = query;

    const { name, pdfBuffer } =
      await this.reportsService.generatePDFporcentajeMes(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="porcentaje-${name}-${year}-${month}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @UseGuards(AuthGuard)
  @Get('excel/planilla-mes')
  async generateExcelplanillaMes(
    @Res() res: Response,
    @Query() query: CreateReportDto,
  ) {
    const { name, excelBuffer } =
      await this.reportsService.generateEXCELplanillaMes(query);
    const { year, month } = query;
    // Configurar la respuesta para la descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="planilla-${name}-${year}-${month}.xlsx"`,
    );

    // Enviar el archivo al cliente
    await excelBuffer.xlsx.write(res);
    res.end();
  }

  @UseGuards(AuthGuard)
  @Get('excel/porcentaje-mes')
  async generateExcelporcentajeMes(
    @Res() res: Response,
    @Query() query: CreateReportDto,
  ) {
    console.log('asdas');
    const { name, excelBuffer } =
      await this.reportsService.generateEXCELporcentajeMes(query);
    const { year, month } = query;
    // Configurar la respuesta para la descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="planilla-${name}-${year}-${month}.xlsx"`,
    );

    // Enviar el archivo al cliente
    await excelBuffer.xlsx.write(res);
    res.end();
  }
}
