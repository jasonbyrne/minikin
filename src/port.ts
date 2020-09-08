import net from "net";

/**
 * This object was based off of:
 * https://github.com/imlinus/portr
 */

class Port {
  public static test(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on("error", () => resolve(false));
      server.listen(port, () => server.close(() => resolve(true)));
    });
  }

  public static next(
    startPort: number = 8000,
    checkNext = 10
  ): Promise<number | null> {
    return new Promise(async (resolve) => {
      const maxPort = startPort + checkNext;
      let firstAvailablePort: number | null = null;
      let portToCheck = startPort;
      do {
        const isAvailable = await Port.test(portToCheck);
        if (isAvailable) {
          firstAvailablePort = portToCheck;
        }
        portToCheck++;
      } while (portToCheck <= maxPort && firstAvailablePort === null);
      return resolve(firstAvailablePort);
    });
  }

  public static check(port: number, checkNext = 10): Promise<true> {
    return new Promise(async (resolve, reject) => {
      // If the one we requested is available, resolve the promise
      const isAvailable = await Port.test(port);
      if (isAvailable) {
        resolve(true);
      }
      // It's not available, but let's suggest an alternative
      if (checkNext > 0) {
        const nextPort = await Port.next(port + 1, checkNext);
        reject(
          nextPort !== null
            ? `Port ${port} is not available. Suggestion: use ${nextPort} instead.`
            : `Port ${port} is not available.`
        );
      }
    });
  }
}

export default Port;
