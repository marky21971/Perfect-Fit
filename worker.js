// Perfect Fit translation workerexport default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Translation API
    if (url.pathname === "/api/translate" && request.method === "POST") {
      try {
        const body = await request.json();

        const text = body.text;
        const targetLang = body.targetLang;

        if (!text || !targetLang) {
          return new Response(
            JSON.stringify({ error: "Missing text or target language" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const response = await fetch("https://api-free.deepl.com/v2/translate", {
          method: "POST",
          headers: {
            "Authorization": `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: [text],
            target_lang: targetLang
          })
        });

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "DeepL translation failed", details: data }),
            {
              status: response.status,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        return new Response(
          JSON.stringify({
            translation: data.translations?.[0]?.text || ""
          }),
          {
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Translation error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // Everything else comes from the website files
    return env.ASSETS.fetch(request);
  }
};
