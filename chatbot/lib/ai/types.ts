export type AIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | UserContentPart[];
};

export type UserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } };

export type FileParserOptions =
  | {
      enabled: true;
      pdf: { engine: 'pdf-text' };
    }
  | undefined;

export type StreamCompletionParams = {
  model: string;
  messages: AIChatMessage[];
  fileParser?: FileParserOptions;
};

/**
 * A provider must return an async iterable of text deltas.
 */
export interface AIProvider {
  streamCompletion(params: StreamCompletionParams): Promise<AsyncIterable<string>>;
}
