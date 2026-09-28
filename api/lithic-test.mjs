export async function GET() {
  const apiKey = process.env.LITHIC_API_KEY;
  const environment = process.env.LITHIC_ENVIRONMENT || "sandbox";

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        connected: false,
        error: "LITHIC_API_KEY is not configured"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const baseUrl =
    environment === "production"
      ? "https://api.lithic.com/v1"
      : "https://sandbox.lithic.com/v1";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    // Get cards
    const cardsResponse = await fetch(
      `${baseUrl}/cards?page_size=10`,
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );

    const cardsData = await cardsResponse.json();

    if (!cardsResponse.ok) {
      return new Response(
        JSON.stringify({
          connected: false,
          environment,
          lithic_status: cardsResponse.status,
          cards: [],
          transactions: [],
          error: cardsData
        }),
        {
          status: cardsResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const cards = cardsData.data || [];
    const card = cards[0];

    if (!card) {
      return new Response(
        JSON.stringify({
          connected: true,
          environment,
          lithic_status: 200,
          card: null,
          transactions: [],
          error: null
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get transactions for the card
    const transactionsResponse = await fetch(
      `${baseUrl}/transactions?card_token=${encodeURIComponent(
        card.token
      )}&page_size=10`,
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );

    const transactionsData = await transactionsResponse.json();

    const transactions = transactionsResponse.ok
      ? (transactionsData.data || []).map((tx) => ({
          token: tx.token,
          amount: tx.amount,
          result: tx.result,
          status: tx.status,
          created: tx.created,
          merchant: tx.merchant
            ? {
                descriptor:
                  tx.merchant.descriptor || "Unknown merchant",
                city: tx.merchant.city || "",
                country: tx.merchant.country || ""
              }
            : null
        }))
      : [];

    return new Response(
      JSON.stringify({
        connected: true,
        environment,
        lithic_status: 200,

        card: {
          token: card.token,
          last_four: card.last_four,
          state: card.state,
          type: card.type,
          exp_month: card.exp_month,
          exp_year: card.exp_year
        },

        transactions,

        transaction_status: transactionsResponse.status,
        transaction_error: transactionsResponse.ok
          ? null
          : transactionsData
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        connected: false,
        environment,
        error:
          error.name === "AbortError"
            ? "Lithic request timed out"
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
