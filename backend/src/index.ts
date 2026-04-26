import express from "express";
import cors from "cors";
import session from "express-session";
import membersRouter from "./routes/members";
import rotationsRouter from "./routes/rotations";
import eventsRouter from "./routes/events";
import gmailRouter from "./routes/gmail";
import { startCronJobs } from "./services/cronService";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use("/members", membersRouter);
app.use("/rotations", rotationsRouter);
app.use("/events", eventsRouter);
app.use("/gmail", gmailRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/config", (_req, res) => {
  const v = process.env.DEV_MODE;
  const devMode = v === "true" || v === "1";
  res.json({ devMode });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  startCronJobs();
});
