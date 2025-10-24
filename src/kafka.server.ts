import { KafkaRetriableException, ServerKafka } from '@nestjs/microservices';
import { Observable, ReplaySubject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class KafkaServer extends ServerKafka {
  private combineStreamsAndThrowIfRetriable(
    response$: Observable<any>,
    replayStream$: ReplaySubject<unknown>,
  ) {
    return new Promise<void>((resolve, reject) => {
      response$.subscribe({
        next: (val) => {
          replayStream$.next(val);
          resolve();
        },
        error: (err) => {
          replayStream$.error(err);
          resolve();
        },
        complete: () => replayStream$.complete(),
      });
    });
  }
}
