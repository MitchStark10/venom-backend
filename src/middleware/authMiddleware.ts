import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { readRequiredEnvVar } from "../lib/readRequiredEnvVar";
import { AuthenticatedRequest } from "../types/express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, readRequiredEnvVar("JWT_SECRET"), (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.userId = (payload as User).id;
    next();
  });
};
