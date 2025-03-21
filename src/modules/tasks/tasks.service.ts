import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RegistrationsService } from '../registrations/registrations.service';

@Injectable()
export class TasksService {
  constructor(private readonly registrationsService: RegistrationsService) {}
  // @Cron('0 * * * * *') // Cada minuto

  @Cron('0 23 * * *') // Tarea que se ejecuta todos los días a las 23:00 horas
  async verificarRegistroUsuarios() {
    // Aquí colocas la lógica para verificar el registro de cada usuario
    console.log('🔄 Verificando asistencia...');
    console.log(await this.registrationsService.validationsRegistrations());
    console.log('✅ Validación completada.');
    // Ejemplo: recorrer usuarios y verificar su estado
    // const usuarios = await this.usuarioService.obtenerUsuarios();
    // usuarios.forEach(usuario => {
    //   if (!usuario.registrado) {
    //     // Realizar acción, por ejemplo, enviar un recordatorio o marcar el usuario
    //   }
    // });
  }

  // @Cron('30 * * * * *')
  // async verificar() {
  //   // Aquí colocas la lógica para verificar el registro de cada usuario
  //   // console.log('Prueba de Cron');

  //   // Ejemplo: recorrer usuarios y verificar su estado
  //   // const usuarios = await this.usuarioService.obtenerUsuarios();
  //   // usuarios.forEach(usuario => {
  //   //   if (!usuario.registrado) {
  //   //     // Realizar acción, por ejemplo, enviar un recordatorio o marcar el usuario
  //   //   }
  //   // });
  // }
}
