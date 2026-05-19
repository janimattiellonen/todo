// Import slonik so roarr initializes globalThis.ROARR with a real writer,
// then replace it with a no-op to silence logs during tests.
import "slonik";

const roarr = (
  globalThis as unknown as Record<string, Record<string, unknown> | undefined>
)["ROARR"];

if (roarr) {
  // biome-ignore lint/suspicious/noEmptyBlockStatements: Intentional no-op to silence logger.
  roarr["write"] = () => {};
}
