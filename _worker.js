export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/translate" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!body.text || !body.targetLanguage) {
          return new Response(
            JSON.stringify({ error: "Text and target language are required." }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const languageCodes = {
          Spanish: "ES",
          French: "FR",
          German: "DE",
          Italian: "IT",
          Portuguese: "PT-PT",
          Swahili: "SW",
          Yoruba: "YO",
          Igbo: "IG",
          Hausa: "HA",
          Filipino: "TL"
        };

        const targetLang = languageCodes[body.targetLanguage];

        if (!targetLang) {
          return new Response(
            JSON.stringify({ error: "Unsupported language." }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const deeplResponse = await fetch(
          "https://api-free.deepl.com/v2/translate",
          {
            method: "POST",
            headers: {
              "Authorization": `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: [body.text],
              target_lang: targetLang
            })
          }
        );

        if (!deeplResponse.ok) {
          return new Response(
            JSON.stringify({ error: "DeepL translation failed." }),
            {
              status: deeplResponse.status,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const data = await deeplResponse.json();

        return new Response(
          JSON.stringify({
            translation: data.translations?.[0]?.text || ""
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Translation request failed." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
