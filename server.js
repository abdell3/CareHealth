require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./src/config/config.json");
const database = require("./src/config/database");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roleRoutes = require("./routes/roles");
const patientRoutes = require("./routes/patients");
const appointmentRoutes = require("./routes/appointments");
const medicalRecordRoutes = require("./routes/medical-records");
const prescriptionRoutes = require("./routes/prescriptions");
const labResultRoutes = require("./routes/lab-results");
const medicalDocumentRoutes = require('./routes/medical-documents');
const pharmacyRoutes = require('./routes/pharmacies');
const RoleService = require("./src/modules/users/RoleService")


const app = express();
const apiVersion = process.env.API_VERSION || config.server.apiVersion || "v1";
const nodeEnv = process.env.NODE_ENV || config.server.nodeEnv || "development";
const isTestEnv = nodeEnv === "test";
const port = Number(process.env.PORT) || config.server.port;

app.use(helmet());
app.use(
  cors({
    origin:
      nodeEnv === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs || 60000,
  max: config.rateLimit.authMaxRequests || 5,
  message: {
    error: "Too many auth attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (!isTestEnv) {
  app.use("/api/", limiter);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CareHealth EHR Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get(`/api/${apiVersion}`, (req, res) => {
  res.json({
    message: "CareHealth EHR API",
    version: apiVersion,
    status: "Running",
    endpoints: {
      auth: `/api/${apiVersion}/auth`,
      users: `/api/${apiVersion}/users`,
      patients: `/api/${apiVersion}/patients`,
      appointments: `/api/${apiVersion}/appointments`,
      medicalRecords: `/api/${apiVersion}/medical-records`,
      prescriptions: `/api/${apiVersion}/prescriptions`,
      labResults: `/api/${apiVersion}/lab-results`,
    },
  });
});

const authBasePath = `/api/${apiVersion}/auth`;
const authMiddlewares = isTestEnv ? [authRoutes] : [authLimiter, authRoutes];
app.use(authBasePath, ...authMiddlewares);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/roles`, roleRoutes);
app.use(`/api/${apiVersion}/patients`, patientRoutes);
app.use(`/api/${apiVersion}/appointments`, appointmentRoutes);
app.use(`/api/${apiVersion}/medical-records`, medicalRecordRoutes);
app.use(`/api/${apiVersion}/prescriptions`, prescriptionRoutes);
app.use(`/api/${apiVersion}/lab-results`, labResultRoutes);
app.use(`/api/${apiVersion}/medical-documents`, medicalDocumentRoutes);
app.use(`/api/${apiVersion}/pharmacies`, pharmacyRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((error, req, res, next) => {
  console.error("Global Error Handler:", error);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    ...(nodeEnv === "development" && { stack: error.stack }),
  });
});

async function startServer() {
  try {
    await database.connect();
    await RoleService.initializeRoles();

    app.listen(port, () => {
      console.log("CareHealth EHR Server Started!");
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${nodeEnv}`);
      console.log(`API Version: ${apiVersion}`);
      console.log(`Health Check: http://localhost:${port}/health`);
      console.log(`API Base URL: http://localhost:${port}/api/${apiVersion}`);
      console.log(`Auth Endpoints:`);
      console.log(`POST http://localhost:${port}/api/${apiVersion}/auth/register`);
      console.log(`POST http://localhost:${port}/api/${apiVersion}/auth/login`);
    });
  } catch (error) {
    console.error("Database connection failed, but server is running:", error.message);
    console.log("You can still test the API endpoints");

    app.listen(port, () => {
      console.log("CareHealth EHR Server Started!");
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${nodeEnv}`);
      console.log(`API Version: ${apiVersion}`);
      console.log(`Health Check: http://localhost:${port}/health`);
      console.log(`API Base URL: http://localhost:${port}/api/${apiVersion}`);
      console.log(`Auth Endpoints:`);
      console.log(`POST http://localhost:${port}/api/${apiVersion}/auth/register`);
      console.log(`POST http://localhost:${port}/api/${apiVersion}/auth/login`);
    });
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };