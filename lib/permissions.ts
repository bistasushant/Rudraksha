type Role = "admin" | "editor" | "user";
type Action = "view" | "add" | "edit" | "delete";

const rolePermissions: Record<Role, Action[]> = {
  admin: ["view", "add", "edit", "delete"],
  editor: ["view", "add", "edit"],
  user: ["view"],
};

export function hasPermission(role: Role, action: Action): boolean {
  return rolePermissions[role]?.includes(action);
}
