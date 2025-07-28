
import { createUniversalPrompt } from "./universal-prompt.ts";

/**
 * Simplified Prompt Manager - Single universal prompt for all scenarios
 */
export class PromptManager {
  getPrompt(
    componentName: string,
    roomType: string,
    imageCount: number
  ): string {
    console.log(`📝 [PROMPT MANAGER] Creating universal prompt for ${componentName}`);
    return createUniversalPrompt(componentName, roomType, imageCount);
  }

  getSupportedModels(): string[] {
    return ['gemini-2.0-flash'];
  }
}
