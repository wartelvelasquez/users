import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetUserProjectionQuery } from '../get-user-projection.query';
import { UserProjectionEntity } from '../../../../shared/infrastructure/entities/user-projection.entity';
import { NotFoundException } from '@nestjs/common';

/**
 * Handler for GetUserProjectionQuery
 * 
 * CQRS Query Handler - Busca en BD de LECTURA (users_read)
 */
@QueryHandler(GetUserProjectionQuery)
export class GetUserProjectionHandler implements IQueryHandler<GetUserProjectionQuery> {
  constructor(
    @InjectRepository(UserProjectionEntity, 'read')
    private readonly projectionRepository: Repository<UserProjectionEntity>,
  ) {}

  async execute(query: GetUserProjectionQuery): Promise<UserProjectionEntity> {
    const projection = await this.projectionRepository.findOne({
      where: { id: query.userId },
    });

    if (!projection) {
      throw new NotFoundException(`User projection not found for ID: ${query.userId}`);
    }

    return projection;
  }
}
