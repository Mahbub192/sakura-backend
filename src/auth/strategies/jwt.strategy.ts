import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // Phone number (primary key)
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') || 'default-secret-key',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub, // This is now the phone number (string)
      email: payload.email,
      role: payload.role,
    };
  }
}
