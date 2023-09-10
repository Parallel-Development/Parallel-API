import express from 'express';

const port = 3000;
export const app = express();

app.listen(port, () => { console.log(`Server running on port ${port}`); })