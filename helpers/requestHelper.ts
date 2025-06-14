// requestHelper.ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const getRequest = async (endpoint: string) => {
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in GET request:", error);
    throw error;
  }
};
