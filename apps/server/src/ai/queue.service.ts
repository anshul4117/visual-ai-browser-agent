import { analyzeScreenshot } from './analysis.service.js';

interface QueueTask {
  screenshotId: string;
  attempts: number;
}

const MAX_RETRIES = 3;

/**
 * Queue Service for background asynchronous AI vision processing.
 */
class AnalysisQueueService {
  private queue: QueueTask[] = [];
  private isProcessing = false;
  private processedIds = new Set<string>();

  /**
   * Enqueue a screenshot for asynchronous AI analysis.
   */
  public enqueue(screenshotId: string): void {
    if (this.processedIds.has(screenshotId)) {
      console.log(`[AI Queue] Skipping duplicate queue request for ${screenshotId}`);
      return;
    }

    this.processedIds.add(screenshotId);
    this.queue.push({ screenshotId, attempts: 0 });
    console.log(`[AI Queue] Enqueued screenshot ${screenshotId} (Queue size: ${this.queue.length})`);

    this.processNext().catch((err) => console.error('[AI Queue] Error in queue worker loop:', err));
  }

  /**
   * Process next item in the background queue.
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const task = this.queue.shift();

    if (!task) {
      this.isProcessing = false;
      return;
    }

    try {
      console.log(`[AI Queue] Processing screenshot analysis: ${task.screenshotId}...`);
      await analyzeScreenshot(task.screenshotId);
      console.log(`[AI Queue] Finished analysis: ${task.screenshotId}`);
    } catch (error) {
      task.attempts += 1;
      console.error(`[AI Queue] Analysis failed for ${task.screenshotId} (attempt ${task.attempts}/${MAX_RETRIES}):`, error);

      if (task.attempts < MAX_RETRIES) {
        // Re-enqueue task for retry
        this.queue.push(task);
      } else {
        console.error(`[AI Queue] Max retries reached for ${task.screenshotId}. Dropping task.`);
      }
    } finally {
      this.isProcessing = false;
      // Continue processing remaining items in queue
      if (this.queue.length > 0) {
        setImmediate(() => {
          this.processNext().catch((err) => console.error('[AI Queue] Error processing next task:', err));
        });
      }
    }
  }

  /**
   * Get current queue metrics.
   */
  public getMetrics(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}

export const analysisQueue = new AnalysisQueueService();
