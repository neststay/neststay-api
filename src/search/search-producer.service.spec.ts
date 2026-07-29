import { Queue } from 'bullmq';
import { SearchProducerService } from './search-producer.service.js';
import { JOB_PROPERTY_INDEX } from './search.constants.js';

describe('SearchProducerService', () => {
  let service: SearchProducerService;
  let queue: { add: jest.Mock };

  beforeEach(() => {
    queue = {
      add: jest.fn(),
    };
    service = new SearchProducerService(queue as unknown as Queue);
  });

  describe('enqueuePropertyIndex', () => {
    it('adds a job with the slug payload and retry/backoff/retention options', async () => {
      queue.add.mockResolvedValue(undefined);

      await service.enqueuePropertyIndex({ payload: { slug: 'a-property' } });

      expect(queue.add).toHaveBeenCalledWith(
        JOB_PROPERTY_INDEX,
        { slug: 'a-property' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600,
          },
          removeOnFail: false,
        },
      );
    });

    it('rethrows and logs when the queue fails to enqueue', async () => {
      const error = new Error('redis unavailable');
      queue.add.mockRejectedValue(error);

      await expect(
        service.enqueuePropertyIndex({ payload: { slug: 'a-property' } }),
      ).rejects.toThrow(error);
    });
  });
});
