import { Global, Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

@Injectable()
@Global()
export class SharedService {
  private stream$;

  constructor() {
    this.stream$ = new BehaviorSubject<any>({});
  }

  getStream() {
    return this.stream$.asObservable();
  }

  next(value: any) {
    this.stream$.next(value);
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
