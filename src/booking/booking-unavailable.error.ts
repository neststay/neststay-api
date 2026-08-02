export class BookingUnavailableError extends Error {
  constructor() {
    super('Requested dates are unavailable');
    this.name = 'BookingUnavailableError';
  }
}
