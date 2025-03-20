/**
 * Link definition between auth and user resources
 * This connects authentication records with user entities in the Medusa core
 */
export default {
  id: "auth-user-link",
  sourceId: "auth",
  sourceType: "auth", 
  targetId: "user",
  targetType: "user",
  type: "one-to-one",
}
