import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import * as console from 'console';
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
  private clients: Set<Socket> = new Set();
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    private conquest: ConquestService
  ) {
    // const changeStream = warModel.watch();
    // changeStream.on('change', async (next) => {
    //   try {
    //     const war = await this.warModel
    //       .findById(next.documentKey._id.toString())
    //       .exec();
    //     this.server.to(war.warId).emit('serverToRoom', JSON.stringify(next));
    //   } catch (e) {}
    // });
    this.conquest.getStream().subscribe(({ warId, ...payload }) => {
      if (this.server) {
        this.server.to(warId).emit('serverToRoom', JSON.stringify(payload));
      }
    });
  }

  handleConnection(client: Socket) {
    this.clients.add(client);
  }

  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item }))
    );
  }

  @SubscribeMessage('roomToServer')
  handleChatMessage(client: Socket, payload: string) {
    try {
      const [room, sender, message] = payload.split('|');
      const clients = this.server.in(room);
      // this.server.to(room).emit('serverToRoom', `${sender} says ${message}`);
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: { warId: string }) {
    client.join(room.warId);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
