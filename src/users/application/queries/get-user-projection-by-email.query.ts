/**
 * Query to get a user projection by email
 * 
 * CQRS Read Model - Optimized for email lookups
 */
export class GetUserProjectionByEmailQuery {
  constructor(public readonly email: string) {}
}

