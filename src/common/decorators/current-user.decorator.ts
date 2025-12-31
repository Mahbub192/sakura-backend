import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RoleType } from '../../entities/role.entity';

export interface CurrentUserPayload {
  userId: string; // Phone number (primary key)
  email: string;
  role: RoleType;
}

interface RequestWithUser extends Request {
  user?: CurrentUserPayload;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
