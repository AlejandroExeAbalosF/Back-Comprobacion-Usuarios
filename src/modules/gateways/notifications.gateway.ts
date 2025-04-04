import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

@WebSocketGateway({
  cors: {
    origin: process.env.URL_FRONTEND, // Cambia esto a la URL de tu frontend en producción
    credentials: true, // Permite cookies si las usas
  },
  transports: ['websocket'], // Asegura que se use WebSockets directamente
  // namespace: '/socket.io', // Asegura que esté en el namespace correcto
})
export class NotificationsGateway {
  @WebSocketServer()
  private server: Server;

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: string): string {
  //   console.log('Mensaje recibido:', payload);
  //   return `Mensaje recibido: ${payload}`;
  // }
  //
  sendNotification(data: unknown) {
    console.log('Enviando notificación:', data);
    this.server.emit('employeeValidated', data); // Envía la notificación a todos los clientes
  }
}
