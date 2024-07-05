/**
 * Function to add the 'toJSON' property to the default error class.
 */
export const initError = () => {
  if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
      value() {
        return {
          name: this.name,
          message: this.message,
          stack: this.stack,
        };
      },
      configurable: true,
      writable: true,
    });
  }
};
