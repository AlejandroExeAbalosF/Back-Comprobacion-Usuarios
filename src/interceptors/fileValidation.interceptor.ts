import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express'; // Importa Request de Express
// Extiende el tipo Request para agregar la propiedad `file`
declare module 'express' {
  interface Request {
    file?: Express.Multer.File;
  }
}
interface FileHandleResponse {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  // Otros campos que puedan ser relevantes para ti
}
@Injectable()
export class OptionalFileInterceptorIMG implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<FileHandleResponse> {
    const request: Request = context.switchToHttp().getRequest();
    const file = request.file; // Obtener el archivo de la solicitud

    if (!file) {
      // Si no hay archivo, asignar null al campo 'file'
      request.file = undefined;
    }
    if (file) {
      // Validar el tipo de archivo
      const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedFileTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'El archivo debe ser una imagen de tipo JPEG, PNG o JPG',
        );
      }

      // Validar el tamaño del archivo
      const maxSize = 200 * 1024; // 200KB
      if (file.size > maxSize) {
        throw new BadRequestException(
          'El tamaño del archivo debe ser menor a 200KB',
        );
      }
    }

    return next.handle().pipe(
      map((data: FileHandleResponse) => {
        return {
          ...data, // return al cliente
        };
      }),
    );
  }
}
