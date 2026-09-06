/**
 * Runs an async worker over a list while staying under a provider's
 * requests-per-second limit.
 *
 * Items are processed in batches of `perSecond`, and each batch is given a
 * full ~1.1s window before the next one starts, so the rolling one-second
 * request rate never exceeds the cap. Resend allows 10 requests/second; we
 * default to 8 to leave headroom for the rolling-window edges.
 *
 * The worker is expected to handle its own errors (like the notification
 * senders do); rejections are swallowed per item so one failure can't stop
 * the rest of the send.
 *
 * @param items Items to process
 * @param worker Async function invoked once per item
 * @param perSecond Maximum requests to start per second (default 8)
 */
export async function forEachRateLimited<T>(
    items: T[],
    worker: (item: T) => Promise<void>,
    perSecond: number = 8,
): Promise<void> {
    const batchSize = Math.max(1, Math.floor(perSecond));
    const windowMs = 1100;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const startedAt = Date.now();

        await Promise.allSettled(batch.map(worker));

        const hasMore = i + batchSize < items.length;
        if (hasMore) {
            const elapsed = Date.now() - startedAt;
            if (elapsed < windowMs) {
                await new Promise((resolve) => setTimeout(resolve, windowMs - elapsed));
            }
        }
    }
}
