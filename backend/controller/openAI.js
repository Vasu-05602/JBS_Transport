const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
async function translator(text) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Convert any word or letter into Marathi Devanagari script. If it's not a valid word or sentence, then convert it to Marathi according to English pronunciation wise and give me only Marathi Converted script, not descriptive.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      stop: ["\n", "\ninput:", "In Marathi Devanagari script", "would be:"],
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
  return text;
}

module.exports = { translator };
