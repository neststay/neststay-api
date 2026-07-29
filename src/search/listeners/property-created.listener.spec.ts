import { PropertyCreatedListener } from './property-created.listener.js';
import { SearchProducerService } from '../search-producer.service.js';

describe('PropertyCreatedListener', () => {
  let listener: PropertyCreatedListener;
  let searchProducer: { enqueuePropertyIndex: jest.Mock };

  beforeEach(() => {
    searchProducer = {
      enqueuePropertyIndex: jest.fn(),
    };
    listener = new PropertyCreatedListener(
      searchProducer as unknown as SearchProducerService,
    );
  });

  describe('handlePropertyCreated', () => {
    it('passes the slug to the search producer', async () => {
      searchProducer.enqueuePropertyIndex.mockResolvedValue(undefined);

      await listener.handlePropertyCreated({ slug: 'a-property' });

      expect(searchProducer.enqueuePropertyIndex).toHaveBeenCalledWith({
        payload: { slug: 'a-property' },
      });
    });

    it('catches and logs producer errors without rethrowing', async () => {
      searchProducer.enqueuePropertyIndex.mockRejectedValue(
        new Error('redis unavailable'),
      );

      await expect(
        listener.handlePropertyCreated({ slug: 'a-property' }),
      ).resolves.toBeUndefined();
    });
  });
});
