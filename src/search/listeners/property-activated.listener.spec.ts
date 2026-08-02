import { PropertyActivatedListener } from './property-activated.listener.js';
import { SearchProducerService } from '../search-producer.service.js';

describe('PropertyActivatedListener', () => {
  let listener: PropertyActivatedListener;
  let searchProducer: { enqueuePropertyIndex: jest.Mock };

  beforeEach(() => {
    searchProducer = {
      enqueuePropertyIndex: jest.fn(),
    };
    listener = new PropertyActivatedListener(
      searchProducer as unknown as SearchProducerService,
    );
  });

  describe('handlePropertyActivated', () => {
    it('passes the slug to the search producer', async () => {
      searchProducer.enqueuePropertyIndex.mockResolvedValue(undefined);

      await listener.handlePropertyActivated({ slug: 'a-property' });

      expect(searchProducer.enqueuePropertyIndex).toHaveBeenCalledWith({
        payload: { slug: 'a-property' },
      });
    });

    it('catches and logs producer errors without rethrowing', async () => {
      searchProducer.enqueuePropertyIndex.mockRejectedValue(
        new Error('redis unavailable'),
      );

      await expect(
        listener.handlePropertyActivated({ slug: 'a-property' }),
      ).resolves.toBeUndefined();
    });
  });
});
