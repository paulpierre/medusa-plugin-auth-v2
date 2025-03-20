import { 
  FindConfig,
  Selector,
  TransactionBaseService,
  buildQuery,
} from "@medusajs/medusa"
import { MedusaError } from "@medusajs/utils"
import { EntityManager } from "typeorm"
import { Auth } from "../models/auth"
import { AuthRepository } from "../repositories/auth"

type InjectedDependencies = {
  manager: EntityManager
  authRepository: typeof AuthRepository
}

type UpdateAuthInput = {
  provider?: string
  provider_id?: string
  profile?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export class AuthService extends TransactionBaseService {
  protected readonly authRepository_: typeof AuthRepository
  protected readonly manager_: EntityManager

  constructor({ manager, authRepository }: InjectedDependencies) {
    super(arguments[0])
    this.manager_ = manager
    this.authRepository_ = authRepository
  }

  async retrieve(
    selector: Selector<Auth>,
    config?: FindConfig<Auth>
  ): Promise<Auth> {
    const manager = this.transactionManager_ ?? this.manager_
    const authRepo = manager.getRepository(Auth)
    const query = buildQuery(selector, config)

    const auth = await authRepo.findOne(query)

    if (!auth) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Auth record not found"
      )
    }

    return auth
  }

  async create(data: Partial<Auth>): Promise<Auth> {
    return await this.atomicPhase_(async (manager) => {
      const authRepo = manager.getRepository(Auth)
      const auth = authRepo.create(data)
      return await authRepo.save(auth)
    })
  }

  async update(
    id: string,
    data: UpdateAuthInput
  ): Promise<Auth> {
    return await this.atomicPhase_(async (manager) => {
      const authRepo = manager.getRepository(Auth)
      const auth = await this.retrieve({ id })

      const updateData: Partial<Auth> = {}
      for (const [key, value] of Object.entries(data)) {
        if (key in auth) {
          switch (key) {
            case 'provider':
            case 'provider_id':
              updateData[key] = value as string
              break
            case 'profile':
            case 'metadata':
              updateData[key] = value as Record<string, unknown>
              break
          }
        }
      }

      Object.assign(auth, updateData)
      return await authRepo.save(auth)
    })
  }

  async delete(id: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const authRepo = manager.getRepository(Auth)
      const auth = await this.retrieve({ id })
      await authRepo.remove(auth)
    })
  }
}
