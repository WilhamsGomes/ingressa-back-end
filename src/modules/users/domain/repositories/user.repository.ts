import { User } from '../entities/user.entity';

export abstract class UserRepository {
  abstract create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User>;
  abstract findAll(): Promise<Partial<User>[] | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract update(userId: string, user: Partial<User>): Promise<User>;
}
