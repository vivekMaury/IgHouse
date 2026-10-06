import { processInstagramWebhook } from '@/lib/workflow-engine';
import { dequeueWebhook, retryWebhook } from '@/lib/queue/upstash';

export async function processQueuedWebhooks(batchSize = 20) {
  let processed = 0;
  let failed = 0;

  for (let index = 0; index < batchSize; index += 1) {
    const item = await dequeueWebhook();
    if (!item) break;

    try {
      await processInstagramWebhook(item.payload);
      processed += 1;
    } catch (error) {
      failed += 1;
      console.error('Instagram webhook processing failed.', { queueItemId: item.id, error });
      await retryWebhook(item);
    }
  }

  return { processed, failed };
}