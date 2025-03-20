import { BeforeInsert, Column, Entity } from "typeorm"
import { BaseEntity, generateEntityId } from "@medusajs/medusa"

@Entity()
export class Auth extends BaseEntity {
  @Column({ type: "varchar" })
  provider!: string

  @Column({ type: "varchar" })
  provider_id!: string

  @Column({ type: "jsonb", nullable: true })
  profile: Record<string, unknown> = {}

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> = {}

  @BeforeInsert()
  protected beforeInsert(): void {
    this.id = generateEntityId(this.id, "auth")
  }
}
