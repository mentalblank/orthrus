import { logger } from "../logger";

/* Local-only: realtime presence/friends WebSocket disabled. */
export class WSClient {
  static async connect() {
    logger.info("WSClient.connect ignored: running in local-only mode");
  }

  public static close() {
    /* no-op */
  }
}
