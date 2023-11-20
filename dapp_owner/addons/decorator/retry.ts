export function WithRetry(retryCount: number = 3) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tryInvoke = async (attempts: number) => {
        try {
          //   console.log("HERE", retryCount);
          return await originalMethod.apply(this, args);
        } catch (error) {
          //check for better error handling
          if (!error._isProviderError && error.code !== "NETWORK_ERROR")
            throw error;
          if (
            (error._isProviderError || error.code === "NETWORK_ERROR") &&
            attempts < retryCount
          ) {
            const retryAfter = generateStallTime();
            console.log(
              `Exceeded alchemy's compute units per second capacity: Retrying after ${retryAfter} ms...`
            );
            staller(retryAfter);
            tryInvoke(attempts + 1);
          }
        }
      };
      return tryInvoke(retryCount);
    };
  };
}

const staller = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateStallTime = () => {
  return Math.floor(Math.random() * 251) + 1000; // Generate a random wait time between 1000ms and 1250ms
};
