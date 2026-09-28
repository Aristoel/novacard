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

  return new Response(
    JSON.stringify({
      server_running: true,
      lithic_key_configured: Boolean(apiKey),
      message: "Vercel function is responding without contacting Lithic"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
