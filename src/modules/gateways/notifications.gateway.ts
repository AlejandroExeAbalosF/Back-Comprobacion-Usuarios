import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // Ajusta el CORS según tu frontend
})
export class NotificationsGateway {
  @WebSocketServer()
  private server: Server;

  //
  sendNotification(data: unknown) {
    this.server.emit('employeeValidated', data); // Envía la notificación a todos los clientes
  }
}
