import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './update-user.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(search?: string) {
    return this.userRepository.findMany(search);
  }

  async getById(id: string) {
    return this.getExistingUser(id);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getExistingUser(id);

    const user = User.create(dto);

    return this.userRepository.update(id, user);
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.getExistingUser(id);
    return this.userRepository.updateStatus(id, isActive);
  }

  async assignRoles(id: string, roleIds: string[] = []) {
    await this.getExistingUser(id);

    const roles = await this.userRepository.findRolesByIds(roleIds);

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles do not exist');
    }

    await this.userRepository.replaceRoles(id, roleIds);

    return this.getExistingUser(id);
  }

  private async getExistingUser(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
