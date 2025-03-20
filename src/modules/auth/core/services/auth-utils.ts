import { MedusaContainer } from "@medusajs/medusa"
import * as bcrypt from "bcrypt"

export class AuthUtils {
  protected readonly container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password
   * @returns True if passwords match, false otherwise
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
      console.error("Error comparing passwords:", error)
      return false
    }
  }

  /**
   * Hash a password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(10)
      return await bcrypt.hash(password, salt)
    } catch (error) {
      console.error("Error hashing password:", error)
      throw error
    }
  }
}
