import { categoryRepository } from "../repositories/category.repository.js";

function toDto(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    is_default: category.userId === null,
  };
}

export async function list(userId, type) {
  const categories = await categoryRepository.listForUser(userId, type);
  return categories.map(toDto);
}

export async function create(userId, { name, type, icon }) {
  const category = await categoryRepository.create({ userId, name, type, icon: icon || null });
  return toDto(category);
}
