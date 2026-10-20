import { User } from '../modules/user/entities/user.entity.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
