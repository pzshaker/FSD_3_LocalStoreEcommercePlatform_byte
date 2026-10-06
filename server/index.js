import app from './app.js';
app.listen(process.env.PORT || 3001, () => console.log(`API listening on http://localhost:${process.env.PORT || 3001}`));
