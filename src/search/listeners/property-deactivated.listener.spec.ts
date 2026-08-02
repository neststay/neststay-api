import { PropertyDeactivatedListener } from './property-deactivated.listener.js';
import { SearchProducerService } from '../search-producer.service.js';

describe('PropertyDeactivatedListener', () => {
  let listener: PropertyDeactivatedListener;
  let searchProducer: { enqueuePropertyIndex: jest.Mock };

  beforeEach(() => {
    searchProducer = {
      enqueuePropertyIndex: jest.fn(),
    };
    listener = new PropertyDeactivatedListener(
      searchProducer as unknown as SearchProducerService,
    );
  });

  describe('handlePropertyDeactivated', () => {
    it('passes the slug to the search producer', async () => {
      searchProducer.enqueuePropertyIndex.mockResolvedValue(undefined);

      await listener.handlePropertyDeactivated({ slug: 'a-property' });

      expect(searchProducer.enqueuePropertyIndex).toHaveBeenCalledWith({
        payload: { slug: 'a-property' },
      });
    });

    it('catches and logs producer errors without rethrowing', async () => {
      searchProducer.enqueuePropertyIndex.mockRejectedValue(
        new Error('redis unavailable'),
      );

      await expect(
        listener.handlePropertyDeactivated({ slug: 'a-property' }),
      ).resolves.toBeUndefined();
    });
  });
});
