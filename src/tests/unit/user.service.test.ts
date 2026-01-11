jest.mock('../../libs/prisma');
jest.mock('bcrypt');

import bcrypt from 'bcrypt';
import { prisma } from '../../libs/prisma';

import {
  createUserService,
  findUserService,
  verifyUserService,
} from '../../services/user.service';

describe('User Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserService', () => {
    it('hashes password and creates user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plain-password',
      };

      const hashedPassword = 'hashed-password';

      const createdUser = {
        id: '1',
        email: userData.email,
        password: hashedPassword,
      };

      // bcrypt.hash mock
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // prisma.user.create mock
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await createUserService(userData);

      // Assertions
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: hashedPassword,
        },
      });

      expect(result).toEqual(createdUser);
    });
  });

  describe('findUserService', () => {
    it('returns user when email exists', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await findUserService('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      expect(result).toEqual(user);
    });

    it('returns null when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserService('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('verifyUserService', () => {
    it('returns true when passwords match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyUserService(
        'plain-password',
        'hashed-password',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        'hashed-password',
      );

      expect(result).toBe(true);
    });

    it('returns false when passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyUserService(
        'wrong-password',
        'hashed-password',
      );

      expect(result).toBe(false);
    });
  });
});
