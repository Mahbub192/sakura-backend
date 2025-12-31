import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Appointment } from '../../entities/appointment.entity';
import { Clinic } from '../../entities/clinic.entity';
import { TokenAppointment } from '../../entities/token-appointment.entity';

type LiveSocket = Socket & {
  joinedRooms?: Set<string>;
};

@WebSocketGateway({
  namespace: '/live-patients',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class LivePatientsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LivePatientsGateway.name);

  handleConnection(client: LiveSocket) {
    client.join('public');
    client.join('live');
    client.joinedRooms = new Set(['public', 'live']);
    this.logger.log(`Client connected to live-patients: ${client.id}`);
  }

  handleDisconnect(client: LiveSocket) {
    this.logger.log(`Client disconnected from live-patients: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { clinicId?: number; doctorId?: number },
    @ConnectedSocket() client: LiveSocket,
  ) {
    try {
      if (data?.clinicId) {
        const room = `clinic:${data.clinicId}`;
        client.join(room);
        client.joinedRooms?.add(room);
      }
      if (data?.doctorId) {
        const room = `doctor:${data.doctorId}`;
        client.join(room);
        client.joinedRooms?.add(room);
      }
      client.emit('joined', { ok: true });
    } catch (err) {
      this.logger.error('Error in join', err);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('control')
  handleControl(
    @MessageBody()
    data: {
      action: string;
      clinicId?: number;
      doctorId?: number;
      currentIndex?: number;
    },
    @ConnectedSocket() client: LiveSocket,
  ) {
    try {
      const clinicRoom = data.clinicId ? `clinic:${data.clinicId}` : null;
      const doctorRoom = data.doctorId ? `doctor:${data.doctorId}` : null;
      // Broadcast control event to clinic room and live room
      if (clinicRoom) this.server.to(clinicRoom).emit('control', data);
      if (doctorRoom) this.server.to(doctorRoom).emit('control', data);
      this.server.to('live').emit('control', data);
    } catch (err) {
      this.logger.error('Error handling control event', err);
      client.emit('error', { message: 'Failed to process control event' });
    }
  }

  // Called by server-side services to broadcast updates
  broadcastTokenUpdate(
    tokenAppointment: TokenAppointment & {
      appointment?: (Appointment & { clinic?: Clinic }) | null;
    },
  ) {
    try {
      const clinicRoom = `clinic:${tokenAppointment.appointment?.clinic?.id || tokenAppointment.appointment?.clinicId}`;
      const doctorRoom = `doctor:${tokenAppointment.doctorId}`;
      this.server.to(clinicRoom).emit('token_updated', tokenAppointment);
      this.server.to(doctorRoom).emit('token_updated', tokenAppointment);
      // also emit to general live room
      this.server.to('live').emit('token_updated', tokenAppointment);
    } catch (err) {
      this.logger.error('Error broadcasting token update', err);
    }
  }
}
