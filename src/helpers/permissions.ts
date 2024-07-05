import { Permissions } from "../enums/permissions";

export function isAdmin(user: { id: string; permissions: Permissions[]; iat: number }): boolean {
  return user.permissions.includes(Permissions.ADMIN);
}
