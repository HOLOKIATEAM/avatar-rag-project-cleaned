export const mockApi = {
  generateResponse: async (message) => {
    // Simuler une réponse
    const responses = {
      salut: { text: "Bonjour ! Comment ça va ?", audioId: "welcome" },
      default: { text: "Vous avez dit : ${message}", audioId: null },
    };
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler délai
    return responses[message.toLowerCase()] || responses.default;
  },
};