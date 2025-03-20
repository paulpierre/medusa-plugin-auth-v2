import { Repository as MedusaRepository } from "typeorm"
import { Auth } from "../models/auth"

export interface AuthRepository extends MedusaRepository<Auth> {}
export const AuthRepository = MedusaRepository<Auth>
