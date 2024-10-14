import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ConquestService {
  private stream$ = new BehaviorSubject<any>({});

  getStream() {
    return this.stream$.asObservable();
  }

  next(value: any) {
    this.stream$.next(value);
  }
}
