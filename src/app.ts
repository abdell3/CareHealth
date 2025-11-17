import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { requestLogger } from "./core/middlewares/requestLogger";
import { errorHandler } from "./core/middlewares/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());

app.use(requestLogger);

// eslint-disable-next-line @typescript-eslint/no-var-requires
app.use("/api", require("./routes"));

app.use(errorHandler);

export default app;


