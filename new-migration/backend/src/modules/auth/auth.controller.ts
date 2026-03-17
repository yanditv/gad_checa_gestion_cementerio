import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiOkResponse({ description: 'User registered successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid registration payload.' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Sign in' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Access token issued successfully.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ description: 'Authenticated user profile returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication token is missing or invalid.' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
