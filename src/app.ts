import 'dotenv/config';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

export const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser(process.env.COOKIE_SECRET!));
app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
