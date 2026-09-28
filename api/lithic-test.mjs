export async function GET() {
  const apiKey = process.env.LITHIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        connected: false,
        error: "Lithic API key is not configured"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      "https://sandbox.lithic.com/v1/cards?page_size=10",
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );

    const data = await response.json();

    return new Response(
      JSON.stringify({
        connected: response.ok,
        lithic_status: response.status,
        cards: response.ok ? (data.data || []).map((card) => ({
          token: card.token,
          last_four: card.last_four,
          state: card.state,
          type: card.type,
          exp_month: card.exp_month,
          exp_year: card.exp_year
        })) : [],
        error: response.ok ? null : data
      }),
      {
        status: response.ok ? 200 : response.status,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        connected: false,
        error:
          error.name === "AbortError"
            ? "Lithic Sandbox request timed out after 8 seconds"
            : error.message
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }
    );
  } finally {
    clearTimeout(timeout);
  }
        }
