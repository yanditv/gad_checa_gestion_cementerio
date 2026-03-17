import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto, RegisterUserDto } from "./auth.dto";
import { User } from "../usuario/user.entity";
import { UserRepository } from "../usuario/user.repository";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto) {
    const existingUser = await this.userRepository.findExistingUser(
      dto.email,
      dto.identificationNumber,
    );

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = User.create({
      identificationNumber: dto.identificationNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password,
      phone: dto.phone,
      address: dto.address,
      identificationType: dto.identificationType,
    });

    const createdUser = await this.userRepository.createUser(user);

    const token = this.jwtService.sign({
      sub: createdUser.id,
      email: createdUser.email,
    });

    return {
      user: {
        id: createdUser.id,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      identificationType: user.identificationType,
      identificationNumber: user.identificationNumber,
    };
  }
}
