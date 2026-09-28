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

  const baseUrl =
    process.env.LITHIC_ENVIRONMENT === "production"
      ? "https://api.lithic.com/v1"
      : "https://sandbox.lithic.com/v1";

  try {
    const cardsResponse = await fetch(
      `${baseUrl}/cards?page_size=10`,
      {
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        }
      }
    );

    const cardsData = await cardsResponse.json();

    if (!cardsResponse.ok) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: cardsData
        }),
        {
          status: cardsResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const card = (cardsData.data || [])[0];

    if (!card) {
      return new Response(
        JSON.stringify({
          connected: true,
          card: null,
          transactions: []
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const txResponse = await fetch(
      `${baseUrl}/transactions?card_token=${encodeURIComponent(
        card.token
      )}&page_size=10`,
      {
        headers: {
          Authorization: apiKey,
          Accept: "application/json"
        }
      }
    );

    const txData = await txResponse.json();

    const transactions = (txData.data || []).map((tx) => ({
      token: tx.token,

      amount: tx.amount ?? 0,
      authorization_amount: tx.authorization_amount ?? 0,
      settled_amount: tx.settled_amount ?? 0,

      status: tx.status || "UNKNOWN",
      result: tx.result || "UNKNOWN",

      authorization_code:
        tx.authorization_code || "N/A",

      network:
        tx.network || "N/A",

      created: tx.created || null,

      merchant: tx.merchant
        ? {
            descriptor:
              tx.merchant.descriptor || "Unknown merchant",
            city: tx.merchant.city || "",
            country: tx.merchant.country || ""
          }
        : null,

      events: tx.events || []
    }));

    return new Response(
      JSON.stringify({
        connected: true,

        environment:
          process.env.LITHIC_ENVIRONMENT || "sandbox",

        card: {
          last_four: card.last_four,
          state: card.state,
          type: card.type,
          exp_month: card.exp_month,
          exp_year: card.exp_year
        },

        transactions
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        connected: false,
        error: error.message
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
          }
