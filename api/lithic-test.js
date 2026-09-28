export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const apiKey = process.env.LITHIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Lithic API key is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const response = await fetch(
      "https://sandbox.lithic.com/v1/cards?page_size=10",
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Lithic request failed",
          details: data
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const cards = (data.data || []).map((card) => ({
      token: card.token,
      last_four: card.last_four,
      state: card.state,
      type: card.type,
      exp_month: card.exp_month,
      exp_year: card.exp_year
    }));

    return new Response(
      JSON.stringify({
        connected: true,
        cards
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
      }
