import express, { type Application, type NextFunction, type Request, type Response } from "express";
import {  type AnalyzeLogRequest, type AnalyzeLogResponse } from "./types/index.js";
import { analyze } from "./services/analyze.js";

const app: Application = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Hello from Express + TypeScript 🚀",
  });
});

app.post(
  "/analyze",
  async (
    req: Request<{}, {}, AnalyzeLogRequest>,
    res: Response
  ): Promise<Response<AnalyzeLogResponse>> => {
  
return res.json( await analyze(req.body))
}
);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});