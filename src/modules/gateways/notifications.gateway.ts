import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

@WebSocketGateway({
  cors: {
    origin: process.env.URL_FRONTEND, // Cambia esto a la URL de tu frontend en producción
    credentials: true, // Permite cookies si las usas
  },
  transports: ['websocket', 'polling'], // Asegura que se use WebSockets directamente
})
export class NotificationsGateway {
  @WebSocketServer()
  private server: Server;

  //
  sendNotification(data: unknown) {
    // console.log('Enviando notificación:', data);
    this.server.emit('employeeValidated', data); // Envía la notificación a todos los clientes
  }
}
