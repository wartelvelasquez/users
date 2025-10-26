import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetUserProjectionByEmailQuery } from '../get-user-projection-by-email.query';
import { UserProjectionEntity } from '../../../../shared/infrastructure/entities/user-projection.entity';
import { NotFoundException } from '@nestjs/common';

/**
 * Handler for GetUserProjectionByEmailQuery
 * 
 * CQRS Query Handler - Busca en BD de LECTURA (users_read)
 */
@QueryHandler(GetUserProjectionByEmailQuery)
export class GetUserProjectionByEmailHandler implements IQueryHandler<GetUserProjectionByEmailQuery> {
  constructor(
    @InjectRepository(UserProjectionEntity, 'read')
    private readonly projectionRepository: Repository<UserProjectionEntity>,
  ) {}

  async execute(query: GetUserProjectionByEmailQuery): Promise<UserProjectionEntity> {
    const projection = await this.projectionRepository.findOne({
      where: { email: query.email },
    });

    if (!projection) {
      throw new NotFoundException(`User projection not found for email: ${query.email}`);
    }

    return projection;
  }
}
