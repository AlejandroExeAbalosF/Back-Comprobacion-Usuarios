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
    .text(LlegadaTarde, 234, y)
    .text(Ausente, 315, y)
    .text(Justificación, 420, y);

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
  async generatePDFplanillaMes(createPDF: CreateReportDto): Promise<Buffer> {
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
    return await new Promise((resolve, reject) => {
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
      doc.font('Helvetica-Bold').text('Nombre, Apellido', 50, 130);
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
      days.map((day) => {
        const registro = registrosPorFecha[day.date];
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
        const entrada = entryZoned ? format(entryZoned, 'HH:mm') : '';
        const salida = exitZoned ? format(exitZoned, 'HH:mm') : '';
        // console.log('entrada', entrada);
        // Puedes agregar lógica para "Llegada tarde" o "Ausente" según la información que tengas
        const llegadaTarde = ''; // Por ejemplo, podrías calcular si la hora de entrada es posterior a la hora programada
        const ausente = registro ? '' : 'Ausente'; // Si no hay registro, marcar como ausente
        const justificacion = registro ? registro.description || '' : '';

        generateTableBody(
          doc,
          invoiceTableTop,
          day.date,
          day.day,
          entrada,
          salida,
          '',
          '',
          '',
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

      const xPositions = [50, 192]; // posiciones de las columnas
      const yInicio = invoiceTableTop - 4.5; // inicio de la celda
      const yFin = invoiceTableTop + 10; // fin de la celda, ajusta la altura según lo necesites

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
        .text('Dias trabajados', 55, invoiceTableTop);

      const xPositionss = [50, 120, 192, 250, 325, 541]; // posiciones de las columnas
      const yInicioo = invoiceTableTop - 4.5; // inicio de la celda
      const yFinn = invoiceTableTop + 10; // fin de la celda, ajusta la altura según lo necesites

      xPositionss.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, yInicioo)
          .lineTo(x, yFinn)
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
        .text('Dias ausentes', 55, invoiceTableTop);

      xPositionss.forEach((x) => {
        doc
          .strokeColor('black')
          .lineWidth(1)
          .moveTo(x, invoiceTableTop - 4.5)
          .lineTo(x, invoiceTableTop + 10)
          .stroke();
      });
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
  }
}
