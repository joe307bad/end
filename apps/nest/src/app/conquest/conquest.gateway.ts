import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { War } from './conquest.controller';
import { ConquestService } from './conquest.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConquestGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    private conquest: ConquestService
  ) {
    this.conquest.getStream().subscribe(({ roomId, ...payload }) => {
      if (this.server) {
        this.server.to(roomId).emit('serverToRoom', JSON.stringify(payload));
      }
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: { roomId: string }) {
    client.join(room.roomId);
    client.emit('joinedRoom', room);
  }
}
