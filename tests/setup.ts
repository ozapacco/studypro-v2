import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

const db = {
  initialize: async (options: { inMemory: boolean }) => {
    console.log(`DB initialized: ${options.inMemory ? 'in-memory' : 'persistent'}`);
  },
  close: async () => {
    console.log('DB closed');
  },
  clear: async () => {
    console.log('DB cleared');
  },
  questionSessions: {
    findById: async (id: string) => null,
    create: async (data: unknown) => data,
  },
  cards: {
    create: async (data: unknown) => data,
    findMany: async () => [],
  },
};

beforeAll(async () => {
  await db.initialize({ inMemory: true });
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.clear();
});

export { db };