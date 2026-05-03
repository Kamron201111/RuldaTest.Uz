export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot ishlayapti 🚀");
  }

  const body = req.body;

  const sendMessage = async (chatId, text, keyboard = null) => {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: keyboard,
      }),
    });
  };

  if (body.message) {
    const chatId = body.message.chat.id;
    const text = body.message.text;

    if (text === "/start") {
      await sendMessage(chatId, "AvtoTest.UZ botiga xush kelibsiz 🚗", {
        keyboard: [
          [{ text: "🚗 Testni boshlash" }],
          [{ text: "📚 Qoidalar kitobi" }]
        ],
        resize_keyboard: true
      });
    }

    if (text === "🚗 Testni boshlash") {
      await sendMessage(chatId, "Testni boshlash uchun tugmani bosing 👇", {
        inline_keyboard: [
          [{
            text: "📝 Testni ochish",
            web_app: { url: "https://avto-test-uz-three.vercel.app" }
          }]
        ]
      });
    }

    if (text === "📚 Qoidalar kitobi") {
      await sendMessage(chatId,
        "Yo'l harakati qoidalari bilan tanishing 👇\nhttps://lex.uz/acts/-2850459"
      );
    }
  }

  res.status(200).send("OK");
  }
