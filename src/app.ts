import 'dotenv/config'
import express from 'express';

export const app = express();

app.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`); })