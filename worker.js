// Perfect Fit translation worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

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
        const targetLang = String(body.targetLang || "").toUpperCase();

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

        const deeplLanguages = {
          ES: "ES",
          FR: "FR",
          DE: "DE",
          IT: "IT",
          PT: "PT-PT"
        };

        const deeplTarget = deeplLanguages[targetLang];

        if (!deeplTarget) {
          return new Response(
            JSON.stringify({
              error: "This language is not currently supported by DeepL."
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

        if (!env.DEEPL_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "DeepL API key is not available to the Worker."
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

        const deeplResponse = await fetch(
          "https://api-free.deepl.com/v2/translate",
          {
            method: "POST",
            headers: {
              "Authorization": "DeepL-Auth-Key " + env.DEEPL_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: [text],
              target_lang: deeplTarget
            })
          }
        );

        const deeplData = await deeplResponse.json();

        if (!deeplResponse.ok) {
          return new Response(
            JSON.stringify({
              error: "DeepL translation failed",
              details: deeplData
            }),
            {
              status: deeplResponse.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            translation:
              deeplData.translations &&
              deeplData.translations[0]
                ? deeplData.translations[0].text
                : ""
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
