const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Эндпоинт для сохранения отчетов (в память или файл)
app.post('/api/save', (req, res) => {
  const data = req.body;
  console.log('Получены данные:', data);
  res.json({ success: true, message: 'Отчет успешно сохранен!' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});