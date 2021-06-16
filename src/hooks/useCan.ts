import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { validadeUserPermissions } from "../utils/validadeUserPermissions";

type UserCanParams = {
  permissions?: string[];
  roles?: string[];
}


export const useCan = ({ permissions, roles }: UserCanParams) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return false;
  }

  const userHasValidPermissions = validadeUserPermissions({
    user,
    permissions,
    roles
  })

  return userHasValidPermissions;
}