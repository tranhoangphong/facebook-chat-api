git init
git remote add origin https://github.com/tranhoangphong/facebook-chat-api.git
git add .
git commit -m "🚀 Initial commit"
git push -u origin main

require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function askGPT(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Bạn là chatbot Facebook thân thiện' },
        { role: 'user', content: prompt }
      ]
    });

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('GPT lỗi:', err.message);
    return 'Bot gặp lỗi khi kết nối OpenAI.';
  }
}

const login = require('facebook-chat-api');

login({ email: 'EMAIL_FACEBOOK', password: 'PASSWORD_FACEBOOK' }, (err, api) => {
  if (err) {
    switch (err.error) {
      case 'login-approval':
        console.log('Bạn cần xác minh 2 bước (code gửi về máy):');
        err.continue('NHẬP_CODE_XÁC_MINH_VÀO_ĐÂY');
        break;
      default:
        console.error(err);
    }
    return;
  }

  console.log('Bot đã đăng nhập thành công!');

  api.listenMqtt((err, message) => {
    if (err) return console.error(err);

    const body = message.body.toLowerCase();

    if (body.startsWith('!ping')) {
      api.sendMessage('🏓 Pong!', message.threadID);
    }

    if (body.startsWith('!gpt')) {
      const question = body.replace('!gpt', '').trim();
      if (!question) return api.sendMessage('Bạn chưa nhập nội dung câu hỏi.', message.threadID);
      api.sendMessage('⏳ Đang suy nghĩ...', message.threadID);

      // gọi OpenAI (nếu có)
      askGPT(question).then(reply => {
        api.sendMessage(reply, message.threadID);
      });
    }
  });
});
