// Perfect Fit translation worker

export default {
  fetch: async (request, env) => {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Allow the browser to check permission before sending the request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/api/translate" && request.method === "POST") {
      try {
        const body = await request.json();

        const text = body.text;
        const targetLang = body.targetLang;

        if (!text || !targetLang) {
          return new Response(
            JSON.stringify({
              error: "Missing text or target language"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const response = await fetch(
          "https://api-free.deepl.com/v2/translate",
          {
            method: "POST",
            headers: {
              "Authorization": `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: [text],
              target_lang: targetLang
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: "DeepL translation failed",
              details: data
            }),
            {
              status: response.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            translation: data.translations?.[0]?.text || ""
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Translation error",
            details: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
