import 'dotenv/config'
import path from 'path';
import express from 'express';

export const app = express();
app.use(express.static(path.join(__dirname, '../public')));

app.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`); })