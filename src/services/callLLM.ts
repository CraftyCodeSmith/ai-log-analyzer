export interface GenerationResult {
  answer: string;
}

interface OllamaResponse {
  response: string;
}

export const callLLM = async (prompt: string) => {
  try {
    const response = await fetch(`${process.env.OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API failed: ${response.status}`);
    }

    const data = (await response.json()) as OllamaResponse;

    return {
      answer: data.response,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Generation failed: ${error.message}`);
    }

    throw new Error("Unknown generation error");
  }
};

