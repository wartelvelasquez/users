/**
 * Query to get a single user projection by ID
 * 
 * CQRS Read Model - Optimized for fast retrieval
 */
export class GetUserProjectionQuery {
  constructor(public readonly userId: string) {}
}

