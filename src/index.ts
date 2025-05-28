import express from 'express';
import { identifyRouter } from './identify';
 // ✅ named import (matches your export)
  // ✅ Use default import
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use('/identify', identifyRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
