import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocumentWithTables from 'pdfkit-table';
// import * as PDFDocument from 'pdfkit';
import PDFDocument from 'pdfkit';
import 'pdfkit-table';
import { Writable } from 'stream';
import {
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  isValid,
} from 'date-fns';
import { es, th } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { Registration } from '../registrations/entities/registration.entity';
import * as ExcelJS from 'exceljs';

const timeZone = 'America/Argentina/Buenos_Aires';

interface EmployeeRecord {
  fecha: string;
  semana: string;
  entrada: string;
  salida: string;
  ausencias: string;
  justificacion: string;
}
function generateTableRow(
  doc: PDFKit.PDFDocument,
  y,
  Fecha,
  Semana,
  Entrada,
  Salida,
  LlegadaTarde,
  Ausente,
  Justificación,
) {
  // Definir donde empieza y termina la línea vertical
  doc
    .strokeColor('black')
    .lineWidth(1)
    .moveTo(50, y - 4)
    .lineTo(541, y - 4)
    .stroke();
  doc
    .fontSize(8)
    .text(Fecha, 63, y)
    .text(Semana, 108, y)
    .text(Entrada, 154, y)
    .text(Salida, 203, y)
    .text(LlegadaTarde, 248, y)
    .text(Ausente, 325, y)
    .text(Justificación, 428, y);

  const xPositions = [50, 100, 146, 192, 238, 313, 370, 541]; // posiciones de las columnas
  const yInicio = y - 4.5; // inicio de la celda
  const yFin = y + 10; // fin de la celda, ajusta la altura según lo necesites

  xPositions.forEach((x) => {
    doc
      .strokeColor('black')
      .lineWidth(1)
      .moveTo(x, yInicio)
      .lineTo(x, yFin)
      .stroke();
  });
}

function generateTableBody(
  doc: PDFKit.PDFDocument,
  y,
  Fecha,
  Semana,
  Entrada,
  Salida,
  LlegadaTarde,
  Ausente,
  Justificación,
) {
  // Definir donde empieza y termina la línea vertical
  if (Semana === 'Sáb' || Semana === 'Dom') {
    const rowHeight = 14; // Ajusta según el tamaño de la fila
    const rowWidth = 491; // Ancho total de la tabla
    const startX = 50; // Ajusta según la posición de inicio

    // Dibujar fondo gris claro
    doc
      .fillColor('#c4c0c0') // Color gris claro
      .rect(startX, y - 4, rowWidth, rowHeight) // Rectángulo de fondo
      .fill(); // Rellenar

    // Restaurar color de texto a negro después de pintar la fila
    doc.fillColor('black');
  }
  doc
    .strokeColor('black')
    .lineWidth(1)
    .moveTo(50, y - 4)
    .lineTo(541, y - 4)
    .stroke();
  doc
    .fontSize(7)
    .fillColor('black')
    .text(Fecha, 57, y)
    .text(Semana, 117, y)
    .text(Entrada, 160, y)
    .text(Salida, 206, y)
    .text(LlegadaTarde, 273, y)
    .text(Ausente, 339, y)
    .text(Justificación, 373, y);

  const xPositions = [50, 100, 146, 192, 238, 313, 370, 541]; // posiciones de las columnas
  const yInicio = y - 4.5; // inicio de la celda
  const yFin = y + 10; // fin de la celda, ajusta la altura según lo necesites

  xPositions.forEach((x) => {
    doc
      .strokeColor('black')
      .lineWidth(1)
      .moveTo(x, yInicio)
      .lineTo(x, yFin)
      .stroke();
  });
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(49, y).lineTo(541, y).stroke();
}

function getDaysOfMonth(year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1)); // Mes en base 0
  const end = endOfMonth(start);

  return eachDayOfInterval({ start, end }).map((date) => {
    let day = format(date, 'EEE', { locale: es }); // Día abreviado en español
    day = day.charAt(0).toUpperCase() + day.slice(1); // Capitalizar primera letra

    return {
      date: format(date, 'yyyy-MM-dd'),
      day,
    };
  });
}
function formatToArgentineTime(dateString: string): string {
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) return ''; // Si la fecha no es válida, retorna cadena vacía
  const localDate = toZonedTime(parsedDate, timeZone);
  return format(localDate, 'HH:mm'); // Formatea a horas y minutos
}

@Injectable()
export class ReportsService {
  constructor(private readonly userService: UsersService) {}
  async generatePDFplanillaMes(createPDF: CreateReportDto) {
    const userFind =
      await this.userService.getUserWithRegistrationsByMonthAndYear(
        createPDF.id,
        createPDF.year,
        createPDF.month,
      );
    // console.log('userFind', userFind);
    // Indexar los registros por fecha (formato 'yyyy-MM-dd')
    if (!userFind) throw new NotFoundException('Empleado no encontrado');
    const registrosPorFecha: { [fecha: string]: Registration } = {};
    if (userFind && userFind.registrations) {
      userFind.registrations.forEach((registro) => {
        if (registro.entryDate) {
          const fechaKey = format(new Date(registro.entryDate), 'yyyy-MM-dd');
          registrosPorFecha[fechaKey] = registro;
        }
      });
    }
    // console.log('registrosPorFecha', registrosPorFecha);
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const doc: PDFKit.PDFDocument = new PDFDocumentWithTables({
        size: 'letter',
        bufferPages: true,
        autoFirstPage: false,
      });
      const buffers: Buffer[] = [];
      const stream = new Writable({
        write(chunk, _, callback) {
          buffers.push(chunk);
          callback();
        },
      });
      doc.pipe(stream);
      doc.addPage({
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72,
        },
      });
      // ✅ Encabezado

      try {
        doc.image('src/helpers/svgviewer-png-output.png', 50, 55, {
          width: 120,
        });
      } catch (error) {
        console.warn('⚠️ No se pudo cargar la imagen del logo:', error);
      }
      doc
        .fillColor('#444444')
        .fontSize(13)
        .text(userFind.secretariat.name, 205, 55, { align: 'right' })
        .fontSize(10)
        .text('Argentina, Salta, Calle 123', 205, 80, { align: 'right' })
        .fontSize(10)
        .text('0387-000000', 205, 90, { align: 'right' })
        .fontSize(10)
        .text('', 205, 100, { align: 'right' })
        .fontSize(10)
        .text('www.vu.cor.ar', 205, 110, { align: 'right' })
        .moveDown();
      // Linena Separadora =>
      const days = getDaysOfMonth(createPDF.year, createPDF.month);
      generateHr(doc, 125);
      doc
        .font('Helvetica-Bold')
        .text('Nombre, Apellido', 50, 130)
        .text(`Turno: ${userFind?.shift?.name}`, 205, 130, { align: 'right' });
      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(userFind.name + ',' + ' ' + userFind.lastName, 50, 143);

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(days[0].date + ' hasta ' + days[days.length - 1].date, 205, 143, {
          align: 'right',
        });
      // Tabla de fechas
      let invoiceTableTop = 160;
      doc.font('Helvetica-Bold');
      generateTableRow(
        doc,
        invoiceTableTop,
        'Fecha',
        'Semana',
        'Entrada',
        'Salida',
        'Llegada tarde',
        'Ausente',
        'Justificación',
      );

      invoiceTableTop = invoiceTableTop + 14;
      let contPresente = 0;
      let contAusente = 0;
      let contLlegadaTarde = 0;
      let contSalidaTemprano = 0;
      days.map((day) => {
        const registro = registrosPorFecha[day.date];
        contPresente = registro?.status
          ? registro.status === 'PRESENTE'
            ? contPresente + 1
            : contPresente
          : contPresente;
        contAusente = registro?.status
          ? registro.status === 'AUSENTE'
            ? contAusente + 1
            : contAusente
          : day.day !== 'Sáb' && day.day !== 'Dom'
            ? contAusente + 1
            : contAusente;

        contLlegadaTarde = registro?.type
          ? registro.type === 'LLEGADA_TARDE' ||
            registro.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
            ? contLlegadaTarde + 1
            : contLlegadaTarde
          : contLlegadaTarde;

        contSalidaTemprano = registro?.type
          ? registro.type === 'SALIDA_TEMPRANA' ||
            registro.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
            ? contSalidaTemprano + 1
            : contSalidaTemprano
          : contSalidaTemprano;
        // Define los datos a mostrar; si no hay registro, quedan vacíos
        // Convertir a la zona horaria de Argentina
        const entryZoned =
          registro?.entryDate && registro?.entryDate
            ? toZonedTime(new Date(registro?.entryDate), timeZone)
            : null;
        const exitZoned =
          registro?.exitDate && registro?.exitDate
            ? toZonedTime(new Date(registro?.exitDate), timeZone)
            : null;

        // Obtener solo hora y minutos en formato HH:mm
        const entrada = entryZoned
          ? registro.type === 'ARTICULO' ||
            registro.type === 'FERIADO' ||
            registro.type === 'VACACIONES'
            ? ''
            : format(entryZoned, 'HH:mm')
          : '';
        const salida = exitZoned ? format(exitZoned, 'HH:mm') : '';
        // console.log('entrada', entrada);
        // Puedes agregar lógica para "Llegada tarde" o "Ausente" según la información que tengas
        const llegadaTarde =
          registro?.type === 'LLEGADA_TARDE' ||
          registro?.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
            ? 'X'
            : '';
        const ausente = registro?.status === 'AUSENTE' ? 'X' : ''; // Si no hay registro, marcar como ausente
        const justificacion = registro
          ? registro.type === 'ARTICULO'
            ? 'Art.' + registro.articulo
            : registro.type
          : '';

        generateTableBody(
          doc,
          invoiceTableTop,
          day.date,
          day.day,
          entrada,
          salida,
          llegadaTarde,
          ausente,
          justificacion,
        );
        invoiceTableTop += 14; // Ajusta la altura de cada fila (cambia el valor según tu necesidad)
      });
      // linea final de tabla
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(49.5, invoiceTableTop - 4)
        .lineTo(541.5, invoiceTableTop - 4)
        .stroke();

      // ✅ Totales
      invoiceTableTop = invoiceTableTop + 14;
      const rowHeight = 14; // Ajusta según el tamaño de la fila
      const rowWidth = 491; // Ancho total de la tabla
      const startX = 50; // Ajusta según la posición de inicie

      // Dibujar fondo gris claro
      doc
        .fillColor('#c4c0c0') // Color gris claro
        .rect(startX, invoiceTableTop - 4, 142, rowHeight) // Rectángulo de fondo
        .fill(); // Rellenar

      // Restaurar color de texto a negro después de pintar la fila
      doc.fillColor('black');
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(49.5, invoiceTableTop - 4)
        .lineTo(192, invoiceTableTop - 4)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text('Totales', 55, invoiceTableTop);
      //primer 3 lineas verticales
      const xPositions = [50, 192]; // posiciones de las columnas
      const yInicio = invoiceTableTop - 4.5; // inicio de la celda
      const yFin = invoiceTableTop + 14; // fin de la celda, ajusta la altura según lo necesites

      xPositions.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, yInicio)
          .lineTo(x, yFin)
          .stroke();
      });
      invoiceTableTop = invoiceTableTop + 14;
      // Dibujar fondo gris claro
      doc
        .fillColor('#c4c0c0') // Color gris claro
        .rect(startX, invoiceTableTop - 4, rowWidth, rowHeight) // Rectángulo de fondo
        .fill(); // Rellenar
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(49.5, invoiceTableTop - 4)
        .lineTo(541, invoiceTableTop - 4)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text('Dias trabajados', 55, invoiceTableTop)
        .text(`${contPresente}`, 125, invoiceTableTop)
        .text(`Llegadas Tardes`, 250, invoiceTableTop)
        .text(`${contLlegadaTarde}`, 318, invoiceTableTop);

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(`${contPresente}`, 125, invoiceTableTop);

      invoiceTableTop = invoiceTableTop + 14;

      // Dibujar fondo gris claro
      doc
        .fillColor('#c4c0c0') // Color gris claro
        .rect(startX, invoiceTableTop - 4, rowWidth, rowHeight) // Rectángulo de fondo
        .fill(); // Rellenar

      const xPositionss = [50, 120, 192, 313, 541]; // posiciones de las columnas
      const yInicioo = invoiceTableTop - 17.5; // inicio de la celda
      const yFinn = invoiceTableTop + 10; // fin de la celda, ajusta la altura según lo necesites

      xPositionss.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, yInicioo)
          .lineTo(x, yFinn)
          .stroke();
      });
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(49.5, invoiceTableTop - 4)
        .lineTo(541, invoiceTableTop - 4)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text('Dias ausentes', 55, invoiceTableTop)
        .text(`${contAusente}`, 125, invoiceTableTop)
        .text(`Salidas Temprano`, 250, invoiceTableTop)
        .text(`${contSalidaTemprano}`, 318, invoiceTableTop);

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(`${contAusente}`, 125, invoiceTableTop);

      invoiceTableTop = invoiceTableTop + 14;

      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(49.5, invoiceTableTop - 4)
        .lineTo(541, invoiceTableTop - 4)
        .stroke();

      // ✅ Finalizar el documento correctamente
      doc.end();
      stream.on('finish', () => resolve(Buffer.concat(buffers)));
      stream.on('error', reject);
    });
    return {
      name: userFind.name + ' ' + userFind.lastName,
      pdfBuffer: pdfBuffer,
    };
  }

  async generatePDFporcentajeMes(createPDF: CreateReportDto) {
    const userFind =
      await this.userService.getUserWithRegistrationsByMonthAndYear(
        createPDF.id,
        createPDF.year,
        createPDF.month,
      );
    if (!userFind) throw new NotFoundException('Empleado no encontrado');
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const doc: PDFKit.PDFDocument = new PDFDocumentWithTables({
        size: 'letter',
        bufferPages: true,
        autoFirstPage: false,
      });
      const buffers: Buffer[] = [];
      const stream = new Writable({
        write(chunk, _, callback) {
          buffers.push(chunk);
          callback();
        },
      });
      doc.pipe(stream);
      doc.addPage({
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72,
        },
      });
      // ✅ Encabezado

      try {
        doc.image('src/helpers/svgviewer-png-output.png', 50, 55, {
          width: 120,
        });
      } catch (error) {
        console.warn('⚠️ No se pudo cargar la imagen del logo:', error);
      }
      doc
        .fillColor('#444444')
        .fontSize(13)
        .text(userFind.secretariat.name, 205, 55, { align: 'right' })
        .fontSize(10)
        .text('Argentina, Salta, Calle 123', 205, 80, { align: 'right' })
        .fontSize(10)
        .text('0387-000000', 205, 90, { align: 'right' })
        .fontSize(10)
        .text('', 205, 100, { align: 'right' })
        .fontSize(10)
        .text('www.vu.cor.ar', 205, 110, { align: 'right' })
        .moveDown();
      // Linena Separadora =>
      // const days = getDaysOfMonth(createPDF.year, createPDF.month);
      const days = getDaysOfMonth(createPDF.year, createPDF.month);
      generateHr(doc, 125);
      doc
        .font('Helvetica-Bold')
        .text('Nombre, Apellido', 50, 130)
        .text(`Turno: ${userFind?.shift?.name}`, 205, 130, { align: 'right' });
      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(userFind.name + ',' + ' ' + userFind.lastName, 50, 143);

      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(days[0].date + ' hasta ' + days[days.length - 1].date, 205, 143, {
          align: 'right',
        });
      // Tabla de fechas
      let invoiceTableTop = 160;

      // Encabezado de la tabla
      //linea horizontal
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(200, invoiceTableTop - 4)
        .lineTo(500, invoiceTableTop - 4)
        .stroke();
      // contenido
      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .fontSize(9)
        .text('Presentismo', 245, invoiceTableTop)
        .text('Puntualidad', 395, invoiceTableTop);

      // linea verticales
      const xPositionsEncabezado = [200, 350, 500]; // posiciones de las columnas
      xPositionsEncabezado.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, invoiceTableTop - 4.5) // inicio de la celda
          .lineTo(x, invoiceTableTop + 10) // fin de la celda, ajusta la altura según lo necesites
          .stroke();
      });
      invoiceTableTop = invoiceTableTop + 14;
      //linea horizontal final de encabezado
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop - 4)
        .lineTo(500, invoiceTableTop - 4)
        .stroke();

      // Cuerpo de la tabla
      // lineas horizontales
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop + 10)
        .lineTo(500, invoiceTableTop + 10)
        .stroke();
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop + 24)
        .lineTo(500, invoiceTableTop + 24)
        .stroke();
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop + 38)
        .lineTo(500, invoiceTableTop + 38)
        .stroke();
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop + 52)
        .lineTo(500, invoiceTableTop + 52)
        .stroke();
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(100, invoiceTableTop + 66)
        .lineTo(500, invoiceTableTop + 66)
        .stroke();
      // contenido
      const registers = userFind.registrations;
      let contPresente = 0;
      let contAusente = 0;
      let contLlegadaTarde = 0;
      registers.map((register) => {
        contPresente = register?.status
          ? register.status === 'PRESENTE'
            ? contPresente + 1
            : contPresente
          : contPresente;
        contAusente = register?.status
          ? register.status === 'AUSENTE'
            ? contAusente + 1
            : contAusente
          : contAusente;
        contLlegadaTarde = register?.type
          ? register.type === 'LLEGADA_TARDE' ||
            register.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
            ? contLlegadaTarde + 1
            : contLlegadaTarde
          : contLlegadaTarde;
      });
      const totalDiasHabiles = contPresente + contAusente;
      const porcentajeAsistencia = Number(
        ((contPresente / totalDiasHabiles) * 100).toFixed(2),
      );
      const porcentajeFaltas = Number(
        ((contAusente / totalDiasHabiles) * 100).toFixed(2),
      );
      const porcentajeRetardos = Number(
        ((contLlegadaTarde / totalDiasHabiles) * 100).toFixed(2),
      );
      const totalDiasHabilAusentes = contAusente + contPresente;
      const totalPorcetajeHabilFaltas = porcentajeAsistencia + porcentajeFaltas;
      doc
        .font('Helvetica-Bold')
        .fillColor('black')
        .fontSize(9)
        .text('Asistencias', 110, invoiceTableTop)
        .text(`${contPresente}`, 203, invoiceTableTop)
        .text(`${porcentajeAsistencia} %`, 265, invoiceTableTop)
        .text('Faltas', 110, invoiceTableTop + 14)
        .text(`${contAusente}`, 203, invoiceTableTop + 14)
        .text(`${porcentajeFaltas} %`, 265, invoiceTableTop + 14)
        .text('Retardos', 110, invoiceTableTop + 28)
        .text(`${contLlegadaTarde}`, 358, invoiceTableTop + 28)
        .text(`${porcentajeRetardos} %`, 413, invoiceTableTop + 28)
        .text('Permisos', 110, invoiceTableTop + 42)
        .text('Total', 110, invoiceTableTop + 56)
        .text(`${totalDiasHabilAusentes}`, 203, invoiceTableTop + 56)
        .text(`${totalPorcetajeHabilFaltas} %`, 265, invoiceTableTop + 56);

      //lineas verticales
      const xPositionsCuerpo = [100, 200, 260, 350, 500]; // posiciones de las columnas
      xPositionsCuerpo.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, invoiceTableTop - 4.5) // inicio de la celda
          .lineTo(x, invoiceTableTop + 66) // fin de la celda, ajusta la altura según lo necesites
          .stroke();
      });

      // doc
      //   .strokeColor('black')
      //   .lineWidth(1)
      //   .moveTo(410, invoiceTableTop - 4.5) // inicio de la celda
      //   .lineTo(410, invoiceTableTop + 24) // fin de la celda, ajusta la altura según lo necesites
      //   .stroke();
      //linea vertical de Puntualidad
      doc
        .strokeColor('black')
        .lineWidth(1)
        .moveTo(410, invoiceTableTop - 4.5) // inicio de la celda
        .lineTo(410, invoiceTableTop + 66) // fin de la celda, ajusta la altura según lo necesites
        .stroke();

      // ✅ Finalizar el documento correctamente
      doc.end();
      stream.on('finish', () => resolve(Buffer.concat(buffers)));
      stream.on('error', reject);
    });
    return {
      name: userFind.name + ' ' + userFind.lastName,
      pdfBuffer: pdfBuffer,
    };
  }

  async generateEXCELplanillaMes(createExcel: CreateReportDto) {
    const userFind =
      await this.userService.getUserWithRegistrationsByMonthAndYear(
        createExcel.id,
        createExcel.year,
        createExcel.month,
      );
    // console.log('userFind', userFind);
    // Indexar los registros por fecha (formato 'yyyy-MM-dd')
    if (!userFind) throw new NotFoundException('Empleado no encontrado');
    const registrosPorFecha: { [fecha: string]: Registration } = {};
    if (userFind && userFind.registrations) {
      userFind.registrations.forEach((registro) => {
        if (registro.entryDate) {
          const fechaKey = format(new Date(registro.entryDate), 'yyyy-MM-dd');
          registrosPorFecha[fechaKey] = registro;
        }
      });
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');
    const days = getDaysOfMonth(createExcel.year, createExcel.month);
    worksheet.columns = [
      { header: 'Fecha', key: 'Fecha', width: 20 },
      { header: 'Semana', key: 'Semana', width: 10 },
      { header: 'Entrada', key: 'Entrada', width: 20 },
      { header: 'Salida', key: 'Salida', width: 15 },
      { header: 'Llegada tarde', key: 'Llegada_tarde', width: 15 },
      { header: 'Ausente', key: 'Ausente', width: 15 },
      { header: 'Justificación', key: 'Justificación', width: 40 },
    ];

    let contPresente = 0;
    let contAusente = 0;
    let contLlegadaTarde = 0;
    let contSalidaTemprano = 0;
    days.map((day) => {
      const registro = registrosPorFecha[day.date];
      contPresente = registro?.status
        ? registro.status === 'PRESENTE'
          ? contPresente + 1
          : contPresente
        : contPresente;
      contAusente = registro?.status
        ? registro.status === 'AUSENTE'
          ? contAusente + 1
          : contAusente
        : day.day !== 'Sáb' && day.day !== 'Dom'
          ? contAusente + 1
          : contAusente;

      contLlegadaTarde = registro?.type
        ? registro.type === 'LLEGADA_TARDE' ||
          registro.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
          ? contLlegadaTarde + 1
          : contLlegadaTarde
        : contLlegadaTarde;

      contSalidaTemprano = registro?.type
        ? registro.type === 'SALIDA_TEMPRANA' ||
          registro.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
          ? contSalidaTemprano + 1
          : contSalidaTemprano
        : contSalidaTemprano;
      // Define los datos a mostrar; si no hay registro, quedan vacíos
      // Convertir a la zona horaria de Argentina
      const entryZoned =
        registro?.entryDate && registro?.entryDate
          ? toZonedTime(new Date(registro?.entryDate), timeZone)
          : null;
      const exitZoned =
        registro?.exitDate && registro?.exitDate
          ? toZonedTime(new Date(registro?.exitDate), timeZone)
          : null;

      // Obtener solo hora y minutos en formato HH:mm
      const entrada = entryZoned
        ? registro.type === 'ARTICULO' ||
          registro.type === 'FERIADO' ||
          registro.type === 'VACACIONES'
          ? ''
          : format(entryZoned, 'HH:mm')
        : '';
      const salida = exitZoned ? format(exitZoned, 'HH:mm') : '';
      // console.log('entrada', entrada);
      // Puedes agregar lógica para "Llegada tarde" o "Ausente" según la información que tengas
      const llegadaTarde =
        registro?.type === 'LLEGADA_TARDE' ||
        registro?.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
          ? 'X'
          : '';
      const ausente = registro?.status === 'AUSENTE' ? 'X' : ''; // Si no hay registro, marcar como ausente
      const justificacion = registro
        ? registro.type === 'ARTICULO'
          ? 'Art.' + registro.articulo
          : registro.type
        : '';
      // Crear objeto asegurando que cada celda tenga un valor (mínimo una cadena vacía)
      const rowData = {
        Fecha: day.date || '',
        Semana: day.day || '',
        Entrada: entrada || '',
        Salida: salida || '',
        Llegada_tarde: llegadaTarde || '',
        Ausente: ausente || '',
        Justificación: justificacion || '',
      };

      // Agregar fila al Excel
      const row = worksheet.addRow(rowData);
      // Verificar si el día es Sábado o Domingo
      if (day.day === 'Sáb' || day.day === 'Dom') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'aeacab' }, // Color gris claro
          };
        });
      }
      // 🔹 Formatear todas las celdas de la fila
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centrar contenido
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // Asegurar que las celdas sin contenido tengan un string vacío
        if (!cell.value) {
          cell.value = ''; // Forzar que tenga contenido
        }
      });
    });
    // 📌 Aplicar estilo a los encabezados (Negrita y fondo de color)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    // Definir las claves de las columnas en orden
    // const columns = [
    //   'Fecha',
    //   'Semana',
    //   'Entrada',
    //   'Salida',
    //   'Llegada_tarde',
    //   'Ausente',
    //   'Justificación',
    // ];

    // // 🔹 Ajustar automáticamente el ancho de las columnas
    // columns.forEach((col, index) => {
    //   worksheet.getColumn(index + 1).width = col.length + 5; // Ajusta el ancho dinámicamente
    // });

    worksheet.addRow([]); // Fila vacía
    const totalRow1 = worksheet.addRow(['Totales']);
    const totalRow2 = worksheet.addRow([
      'Días Trabajados:',
      contPresente,
      'Llegadas Tardes:',
      contLlegadaTarde,
    ]);
    const totalRow3 = worksheet.addRow([
      'Días Ausentes:',
      contAusente,
      'Salidas Tempranas:',
      contSalidaTemprano,
    ]);

    // Aplicar estilos a cada fila
    [totalRow1, totalRow2, totalRow3].forEach((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centrar contenido
        cell.font = { bold: true }; // Negrita
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (!cell.value) {
          cell.value = ''; // Evitar que Excel ignore la celda si está vacía
        }
      });
    });
    // const data = [
    //   { id: 1, name: 'Juan Pérez', attendance: 95.5 },
    //   { id: 2, name: 'Ana López', attendance: 87.2 },
    //   { id: 3, name: 'Carlos Ramírez', attendance: 92.8 },
    // ];

    // data.forEach((item) => {
    //   worksheet.addRow(item);
    // });

    // worksheet.getRow(1).eachCell((cell) => {
    //   cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    //   cell.fill = {
    //     type: 'pattern',
    //     pattern: 'solid',
    //     fgColor: { argb: '4472C4' },
    //   };
    //   cell.alignment = { horizontal: 'center' };
    // });
    // Promise.resolve(workbook);
    const buffer: ExcelJS.Workbook = await Promise.resolve(workbook);
    return {
      name: userFind.name + ' ' + userFind.lastName,
      excelBuffer: buffer,
    };
  }
}
