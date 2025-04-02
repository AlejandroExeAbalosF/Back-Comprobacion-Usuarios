import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, ServerOptions } from 'socket.io';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

@WebSocketGateway({
  cors: {
    origin: process.env.URL_FRONTEND, // Cambia esto a la URL de tu frontend en producción
    credentials: true, // Permite cookies si las usas
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // Asegura que se use WebSockets directamente
})
export class NotificationsGateway {
  @WebSocketServer()
  private server: Server;

  afterInit(server: Server) {
    const options = (server as any).opts as ServerOptions;
    console.log(
      'WebSocket server initialized with transports:',
      options.transports,
    );
  }
  //
  sendNotification(data: unknown) {
    console.log('Enviando notificación:', data);
    this.server.emit('employeeValidated', data); // Envía la notificación a todos los clientes
  }
}
