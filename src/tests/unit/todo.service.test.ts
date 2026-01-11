jest.mock('../../libs/prisma');
jest.mock('../../redis/redis');

import {
  createTodoService,
  getTodoService,
  deleteTodoService,
  patchTodoService,
} from '../../services/todo.service';

import { prisma } from '../../libs/prisma';
import redis from '../../redis/redis';

describe('Todo Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTodoService', () => {
    it('Creates todo and clears cache', async () => {
      const mockTodo = {
        id: '1',
        title: 'Learn Jest',
        completed: false,
        userId: 'user-1',
      };

      (prisma.todo.create as jest.Mock).mockResolvedValue(mockTodo);
      (redis.keys as jest.Mock).mockResolvedValue([]);

      const result = await createTodoService('user-1', {
        title: 'Learn Jest',
        completed: false,
      });

      expect(prisma.todo.create).toHaveBeenCalledWith({
        data: {
          title: 'Learn Jest',
          completed: false,
          userId: 'user-1',
        },
      });

      expect(result).toEqual(mockTodo);
    });
  });

  describe('getTodoService', () => {
    it('Returns cached data when cache exists', async () => {
      const cachedResult = {
        data: [{ id: '1', title: 'Cached Todo' }],
        meta: { totalItems: 1 },
      };
      (redis.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await getTodoService(1, 5);

      expect(redis.get).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('Fetch from DB and sets cache when cache is empty', async () => {
      const todos = [{ id: '1', title: 'DB Todo' }];
      const total = 1;

      (redis.get as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockResolvedValue([todos, total]);

      const result = await getTodoService(1, 5);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      // expect(result.data).toEqual(todos);
      // expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('deleteTodoService', () => {
    it('Deletes todo and clears cache', async () => {
      const deletedTodo = { id: '1' };

      (prisma.todo.delete as jest.Mock).mockResolvedValue(deletedTodo);
      (redis.keys as jest.Mock).mockResolvedValue([]);

      const result = await deleteTodoService('1');

      expect(prisma.todo.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(result).toEqual(deletedTodo);
    });
  });

  describe('patchTodoService', () => {
    it('Updates todo and clears cache', async () => {
      const updatedTodo = { id: '1', title: 'Updated Todo' };

      (prisma.todo.update as jest.Mock).mockResolvedValue(updatedTodo);
      (redis.keys as jest.Mock).mockResolvedValue([]);

      const result = await patchTodoService('1', {
        title: 'Updated Todo',
      });

      expect(prisma.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'Updated Todo' },
      });

      expect(result).toEqual(updatedTodo);
    });
  });
});
