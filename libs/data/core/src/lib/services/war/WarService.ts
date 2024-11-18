import { Context } from 'effect';
import { IWarService } from '../war.service';

export const WarService = Context.GenericTag<IWarService>('war-service');
