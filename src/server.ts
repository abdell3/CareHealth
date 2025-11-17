import app from "./app";
import config from "./config/config.json";

const PORT = Number(process.env.PORT) || (config as any).server.port;

const startServer = () => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
};

export { startServer };


