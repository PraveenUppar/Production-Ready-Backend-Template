import { prisma } from '../libs/prisma';
import bcrypt from 'bcrypt';

interface UserData {
  email: string;
  password: string;
}

const createUserService = async (userData: UserData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
    },
  });
  return newUser;
};

const findUserService = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return user;
};

const verifyUserService = async (password: string, hashedPassword: string) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

export { createUserService, findUserService, verifyUserService };
