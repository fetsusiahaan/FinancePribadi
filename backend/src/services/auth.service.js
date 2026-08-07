import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { signToken } from "../utils/jwt.js";

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, passwordHash });
  const token = signToken({ sub: user.id });
  return { user_id: user.id, token };
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  const token = signToken({ sub: user.id });
  return { user_id: user.id, token };
}
