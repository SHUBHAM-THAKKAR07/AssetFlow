import cors from 'cors';

export const corsOptions: cors.CorsOptions = {
  origin: [
  'https://shubham-thakkar07.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

export const corsMiddleware = cors(corsOptions);
export default corsMiddleware;
