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
      let contPermiso = 0;
      registers.map((register) => {
        contPresente = register?.status
          ? register.status === 'PRESENTE'
            ? contPresente + 1
            : contPresente
          : contPresente;
        contPermiso = register?.type
          ? register.type === 'PERMISO'
            ? contPermiso + 1
            : contPermiso
          : contPermiso;
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
      let porcentajeAsistencia = 0;
      let porcentajeFaltas = 0;
      let porcentajeRetardos = 0;
      let porcentajePermisos = 0;

      // Verificamos que totalDiasHabiles no sea 0 antes de calcular porcentajes
      if (totalDiasHabiles > 0) {
        porcentajeAsistencia = Number(
          ((contPresente / totalDiasHabiles) * 100).toFixed(2),
        );
        porcentajeFaltas = Number(
          ((contAusente / totalDiasHabiles) * 100).toFixed(2),
        );
        porcentajeRetardos = Number(
          ((contLlegadaTarde / totalDiasHabiles) * 100).toFixed(2),
        );
        porcentajePermisos = Number(
          ((contPermiso / totalDiasHabiles) * 100).toFixed(2),
        );
      }
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
        .text(`${contPermiso}`, 358, invoiceTableTop + 42)
        .text(`${porcentajePermisos} %`, 413, invoiceTableTop + 42)
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
    const days = getDaysOfMonth(createExcel.year, createExcel.month);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');
    const nameRow7 = worksheet.addRow(['Nombre y apellido']);
    const nameRow6 = worksheet.addRow([
      userFind.name + ' ' + userFind.lastName,
    ]);
    // Luego, asignar el dato adicional en la columna G (columna 7)
    nameRow7.getCell(7).value = 'Turno: ' + userFind?.shift?.name || 'N/A';

    // Si deseas aplicar estilo o formato, puedes hacerlo:
    nameRow7.getCell(7).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    nameRow6.getCell(7).value =
      days[0].date + ' hasta ' + days[days.length - 1].date;
    nameRow6.getCell(7).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    worksheet.addRow([]); // Fila vacía
    // const days = getDaysOfMonth(createExcel.year, createExcel.month);
    // worksheet.spliceRows(1, 0, ['Encabezado adicional']);

    // Agregar la fila de encabezado manualmente en la fila 4
    const header = [
      'Fecha',
      'Semana',
      'Entrada',
      'Salida',
      'Llegada tarde',
      'Ausente',
      'Justificación',
    ];
    const headerRow = worksheet.addRow(header);

    // Aplicar estilos a la fila de encabezado
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Ajustar el ancho de las columnas manualmente
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 10;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 40;

    let contPresente = 0;
    let contAusente = 0;
    let contLlegadaTarde = 0;
    let contSalidaTemprano = 0;

    // A partir de la fila 5 se agregan los datos
    days.forEach((day) => {
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

      // Convertir a la zona horaria de Argentina
      const entryZoned = registro?.entryDate
        ? toZonedTime(new Date(registro.entryDate), timeZone)
        : null;
      const exitZoned = registro?.exitDate
        ? toZonedTime(new Date(registro.exitDate), timeZone)
        : null;

      const entrada = entryZoned
        ? registro.type === 'ARTICULO' ||
          registro.type === 'FERIADO' ||
          registro.type === 'VACACIONES'
          ? ''
          : format(entryZoned, 'HH:mm')
        : '';
      const salida = exitZoned ? format(exitZoned, 'HH:mm') : '';
      const llegadaTarde =
        registro?.type === 'LLEGADA_TARDE' ||
        registro?.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
          ? 'X'
          : '';
      const ausente = registro?.status === 'AUSENTE' ? 'X' : '';
      const justificacion = registro
        ? registro.type === 'ARTICULO'
          ? 'Art.' + registro.articulo
          : registro.type
        : '';

      // Arreglo con los datos en el mismo orden que el encabezado
      const rowArray = [
        day.date || '',
        day.day || '',
        entrada || '',
        salida || '',
        llegadaTarde || '',
        ausente || '',
        justificacion || '',
      ];

      const row = worksheet.addRow(rowArray);

      // Si el día es Sábado o Domingo, aplica un color de fondo
      if (day.day === 'Sáb' || day.day === 'Dom') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'aeacab' },
          };
        });
      }

      // Aplicar estilos a la fila
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (!cell.value) {
          cell.value = '';
        }
      });
    });

    // Agregar filas de totales al final
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

    [totalRow1, totalRow2, totalRow3].forEach((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (!cell.value) {
          cell.value = '';
        }
      });
    });

    const buffer: ExcelJS.Workbook = await Promise.resolve(workbook);
    return {
      name: `${userFind.name} ${userFind.lastName}`,
      excelBuffer: buffer,
    };
  }

  async generateEXCELporcentajeMes(createExcel: CreateReportDto) {
    // Obtener los datos
    const userFind =
      await this.userService.getUserWithRegistrationsByMonthAndYear(
        createExcel.id,
        createExcel.year,
        createExcel.month,
      );
    if (!userFind) throw new NotFoundException('Empleado no encontrado');
    const days = getDaysOfMonth(createExcel.year, createExcel.month);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Agregar el nombre del empleado
    const nameRow7 = worksheet.addRow(['Nombre y apellido']);
    const nameRow6 = worksheet.addRow([
      userFind.name + ' ' + userFind.lastName,
    ]);

    nameRow7.getCell(6).value = 'Turno: ' + userFind?.shift?.name || 'N/A';

    // Si deseas aplicar estilo o formato, puedes hacerlo:
    nameRow6.getCell(6).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    nameRow6.getCell(6).value =
      days[0].date + ' hasta ' + days[days.length - 1].date;
    nameRow6.getCell(6).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // Encabezado de la tabla
    worksheet.addRow([]); // Fila vacía
    const header = ['', 'Presentismo', '', 'Puntualidad', ''];
    const headerRow = worksheet.addRow(header);

    // Combinar celdas para Presentismo y Puntualidad
    worksheet.mergeCells('B4:C4'); // Presentismo
    worksheet.mergeCells('D4:E4'); // Puntualidad

    // Aplicar estilos a los encabezados principales
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Ancho de columnas
    worksheet.getColumn(1).width = 20; // Concepto
    worksheet.getColumn(2).width = 10; // Cantidad
    worksheet.getColumn(3).width = 15; // Porcentaje
    worksheet.getColumn(4).width = 10; // Cantidad Puntualidad
    worksheet.getColumn(5).width = 15; // Porcentaje Puntualidad

    const registers = userFind.registrations;
    let contPresente = 0,
      contAusente = 0,
      contLlegadaTarde = 0,
      contPermiso = 0;

    registers.map((register) => {
      if (register?.status === 'PRESENTE') contPresente++;
      if (register?.status === 'AUSENTE') contAusente++;
      if (register?.type === 'PERMISO') contPermiso++;
      if (
        register?.type === 'LLEGADA_TARDE' ||
        register?.type === 'LLEGADA_TARDE-SALIDA_TEMPRANA'
      )
        contLlegadaTarde++;
    });

    const totalDiasHabiles = contPresente + contAusente;
    let porcentajeAsistencia = 0;
    let porcentajeFaltas = 0;
    let porcentajeRetardos = 0;
    let porcentajePermisos = 0;

    // Verificamos que totalDiasHabiles no sea 0 antes de calcular porcentajes
    if (totalDiasHabiles > 0) {
      porcentajeAsistencia = Number(
        ((contPresente / totalDiasHabiles) * 100).toFixed(2),
      );
      porcentajeFaltas = Number(
        ((contAusente / totalDiasHabiles) * 100).toFixed(2),
      );
      porcentajeRetardos = Number(
        ((contLlegadaTarde / totalDiasHabiles) * 100).toFixed(2),
      );
      porcentajePermisos = Number(
        ((contPermiso / totalDiasHabiles) * 100).toFixed(2),
      );
    }
    const totalDiasHabilAusentes = contAusente + contPresente;
    const totalPorcetajeHabilFaltas = porcentajeAsistencia + porcentajeFaltas;
    // Agregar filas de la tabla
    const dataRows = [
      ['Asistencias', contPresente, `${porcentajeAsistencia} %`, '', ''],
      ['Faltas', contAusente, `${porcentajeFaltas} %`, '', ''],
      ['Retardos', '', '', contLlegadaTarde, `${porcentajeRetardos} %`],
      ['Permisos', '', '', contPermiso, `${porcentajePermisos} %`],
      [
        'Total',
        totalDiasHabilAusentes,
        `${totalPorcetajeHabilFaltas} %`,
        '',
        '',
      ],
    ];

    dataRows.forEach((row) => {
      const newRow = worksheet.addRow(row);
      newRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Retornar el archivo Excel
    const buffer: ExcelJS.Workbook = await Promise.resolve(workbook);
    return {
      name: `${userFind.name} ${userFind.lastName}`,
      excelBuffer: buffer,
    };
  }
}
