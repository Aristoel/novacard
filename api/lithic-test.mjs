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
    // Get the available Sandbox cards
    const cardsResponse = await fetch(
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

    const cardsData = await cardsResponse.json();

    if (!cardsResponse.ok) {
      return new Response(
        JSON.stringify({
          connected: false,
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
          lithic_status: 200,
          cards: [],
          transactions: [],
          error: null
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get transactions belonging to this card
    const transactionsResponse = await fetch(
      "https://sandbox.lithic.com/v1/transactions?card_token=" +
        encodeURIComponent(card.token) +
        "&page_size=10",
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
      ? (transactionsData.data || []).map((transaction) => ({
          token: transaction.token,
          amount: transaction.amount,
          result: transaction.result,
          status: transaction.status,
          created: transaction.created,
          merchant: transaction.merchant
            ? {
                descriptor: transaction.merchant.descriptor || "Unknown merchant",
                city: transaction.merchant.city || "",
                country: transaction.merchant.country || ""
              }
            : null
        }))
      : [];

    return new Response(
      JSON.stringify({
        connected: true,
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
