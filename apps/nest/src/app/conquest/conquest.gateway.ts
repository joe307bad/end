import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import * as console from 'console';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConquestGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item }))
    );
  }

  @SubscribeMessage('roomToServer')
  handleChatMessage(client: Socket, payload: any) {
    try {
      const [room, sender, message] = payload.body.split("|");
      const clients = this.server.in(room);
      this.server.to(room).emit('serverToRoom', `${sender} says ${message}`);
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: { body: string }) {
    client.join(room.body);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
