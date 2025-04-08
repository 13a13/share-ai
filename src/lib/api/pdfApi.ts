
// PDF Generation API
export const PDFGenerationAPI = {
  generatePDF: async (reportId: string): Promise<string> => {
    // In a real implementation, this would call a backend service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/reports/${reportId}/download`);
      }, 3000);
    });
  },
};
