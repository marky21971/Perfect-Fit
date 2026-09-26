// Perfect Fit Translation Worker

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Allow the Perfect Fit website to call this Worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle browser security check
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Translation API
    if (url.pathname === "/api/translate" && request.method === "POST") {
      try {
        const body = await request.json();

        const text = String(body.text || "").trim();
        const targetLang = String(body.targetLang || "").toUpperCase();

        if (!text) {
          return new Response(
            JSON.stringify({
              error: "Please enter some text to translate."
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

        if (!targetLang) {
          return new Response(
            JSON.stringify({
              error: "Please select a language."
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

        // Languages currently supported by this translator
        const supportedLanguages = {
          ES: "ES",
          FR: "FR",
          DE: "DE",
          IT: "IT",
          PT: "PT-PT"
        };

        const deeplTarget = supportedLanguages[targetLang];

        if (!deeplTarget) {
          return new Response(
            JSON.stringify({
              error: "That language is not currently supported."
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

        // Get the encrypted DeepL key from Cloudflare
        const apiKey = env.DEEPL_API_KEY;

        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: "The DeepL API key is not connected to this Worker."
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

        // Send the translation request to DeepL
        const deeplResponse = await fetch(
          "https://api-free.deepl.com/v2/translate",
          {
            method: "POST",
            headers: {
              "Authorization": "DeepL-Auth-Key " + apiKey,
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
              error: "DeepL could not complete the translation.",
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

        const translation =
          deeplData.translations &&
          deeplData.translations.length > 0
            ? deeplData.translations[0].text
            : "";

        return new Response(
          JSON.stringify({
            translation: translation
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
            error: "Translation error.",
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

    // Everything else is served by the Perfect Fit website
    return env.ASSETS.fetch(request);
  }
};
