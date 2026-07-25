import cors from 'cors';

export const corsOptions: cors.CorsOptions = {
  origin: [
    'https://github.io', // Allow your production live website
    'http://localhost:5173',               // Keep local Vite development working
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

export const corsMiddleware = cors(corsOptions);
export default corsMiddleware;
