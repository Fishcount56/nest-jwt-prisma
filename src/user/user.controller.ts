import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { getCurrentUser } from 'src/auth/common/decorators';
import { User } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@getCurrentUser('firstName') firstName: string): object {
    let response = {
      status: 200,
      message: "OK",
      data: {
        firstName
      }
    }
    return response
  }
}