import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '../../entities/role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // First check handler-level (method) decorator, then class-level
    const handlerRoles = this.reflector.get<RoleType[]>(ROLES_KEY, context.getHandler());
    const classRoles = this.reflector.get<RoleType[]>(ROLES_KEY, context.getClass());
    
    // Debug: Check what roles are found
    console.log('[RolesGuard] Metadata check:', {
      handlerRoles,
      classRoles,
      handlerName: context.getHandler().name,
      className: context.getClass().name,
    });
    
    // Handler-level decorator takes precedence over class-level
    const requiredRoles = handlerRoles || classRoles;
    
    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[RolesGuard] No roles required, allowing access');
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    
    // Debug logging
    console.log('[RolesGuard] Checking roles:', {
      requiredRoles,
      handlerRoles,
      classRoles,
      user: user ? { userId: user.userId, email: user.email, role: user.role } : null,
      path: request.url,
      method: request.method,
    });
    
    if (!user) {
      console.error('[RolesGuard] User object is missing from request. Request:', {
        url: request.url,
        headers: request.headers,
      });
      return false;
    }
    
    if (!user.role) {
      console.error('[RolesGuard] User role is missing. User object:', JSON.stringify(user, null, 2));
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => {
      // Case-insensitive comparison for safety
      const userRole = String(user.role).trim();
      const requiredRole = String(role).trim();
      const roleMatch = userRole === requiredRole;
      
      if (!roleMatch) {
        console.error(`[RolesGuard] Role mismatch: user.role="${userRole}" (type: ${typeof userRole}), required="${requiredRole}" (type: ${typeof requiredRole})`);
      } else {
        console.log(`[RolesGuard] Role match: user.role="${userRole}" === required="${requiredRole}"`);
      }
      return roleMatch;
    });
    
    if (!hasRole) {
      console.error('[RolesGuard] Access denied. User does not have required role.');
    }
    
    return hasRole;
  }
}
