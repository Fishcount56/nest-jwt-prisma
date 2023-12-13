import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, LoginDto } from './dto';
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService 
{
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private configService: ConfigService
    ) {}

    async register(authDto: AuthDto) {
        const hash = await argon.hash(authDto.password)
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: authDto.email,
                    firstName: authDto.firstName,
                    lastName: authDto.lastName,
                    hash
                }
            })
    
            return this.signToken(user.user_id, user.email)
        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if(error.code === 'P2002') {
                    throw new ForbiddenException('Credentials Taken')
                }
            }
        }
    }

    async login(LoginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where : {
                email: LoginDto.email
            }
        })

        if(!user) {
            throw new ForbiddenException('Credentials Incorrect')
        }

        const passwordMatch = await argon.verify(user.hash, LoginDto.password)

        if(!passwordMatch) {
            throw new ForbiddenException('Credentials Incorrect')
        }
        const token = await this.signToken(user.user_id, user.email)

        return {
            userId: user.user_id,
            token
        }
    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email
        }
    
        const secret = this.configService.get('JWT_SECRET')
    
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret
        })
    
        return {
            access_token: token
        }
    }
}
