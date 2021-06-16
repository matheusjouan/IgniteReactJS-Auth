type User = {
  permissions: string[];
  roles: string[];
}

type ValidadeUserPermissions = {
  user: User
  permissions?: string[];
  roles?: string[];
}

export function validadeUserPermissions({
  roles,
  permissions,
  user
}: ValidadeUserPermissions) {


  if (permissions?.length > 0) {
    const hasAllPermissions = permissions.every(permission => {
      return user.permissions.includes(permission)
    });

    if (!hasAllPermissions) {
      return false;
    }
  }

  if (roles?.length > 0) {
    // Verifica se o usuário tem alguma(s) das roles
    const hasAllRoles = roles.some(role => {
      return user.roles.includes(role)
    });

    if (!hasAllRoles) {
      return false;
    }
  }

  return true;
}