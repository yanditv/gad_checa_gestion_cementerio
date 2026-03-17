import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto, RegisterUserDto } from "./auth.dto";
import { AuthUser } from "./auth-user.entity";
import { AuthRepository } from "./auth.repository";

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
        id: user.id,
        firstName: user.nombre,
        lastName: user.apellido,
        email: user.email,
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
        firstName: user.nombre,
        lastName: user.apellido,
        email: user.email,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findProfileById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      email: user.email,
      phone: user.telefono,
      address: user.direccion,
      identificationType: user.tipoIdentificacion,
      identificationNumber: user.numeroIdentificacion,
    };
  }
}
