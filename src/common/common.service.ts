import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException, OnModuleInit, RequestTimeoutException, UnauthorizedException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { AppService } from '../app.service';

@Injectable()
export class CommonService implements OnModuleInit {
  constructor(
    @Inject('USER-MICRO-SERVICE')
    private readonly cfs: ClientKafka,
    private appService: AppService,
  ) {}

  onModuleInit() {
    [
      'check-user',
      'check-empresa',
      'register-customer',
      'update-customer',
      'get-all-customers',
      'get-customer-by-id',
      'get-categories',
      'get-gift-cards',
      'place-order',
      'giftcard-order-list',
      'giftcard-order-detail'
    ].forEach((key) =>
      this.cfs.subscribeToResponseOf(`${key}`),
    );
  }

  async microevento(nameEvent: string, payload: any) {
    try {
      const data = await firstValueFrom(
        this.cfs.send(nameEvent, payload).pipe(timeout(50000)),
      );

      if (data.success) {
        return data;
      } else {
        this.handleMicroservicesError(data);
      }
    } catch (error) {
      this.handleMicroservicesError(error);
    }
  }

  handleMicroservicesError(error: any) {
    const logger = new Logger('CommonService');
    const data = error;

    if (data) {
      if (data.status === 403) {
        throw new ForbiddenException(data);
      } else if (data.status === 401) {
        throw new UnauthorizedException(data);
      } else if (
        data.status === 400 ||
        error instanceof BadRequestException
      ) {
        throw new BadRequestException(data);
      } else if (
        data.status === 404 ||
        error instanceof NotFoundException
      ) {
        throw new NotFoundException(data);
      }
    } else {
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error);
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error);
      }
    }
    logger.error(`Error: ${JSON.stringify(error)}`);

    if (error instanceof Object) {
      throw new BadRequestException(error);
    } else {
      throw new BadRequestException({error});
    }
  }
}
