"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const members_1 = __importDefault(require("./routes/members"));
const rotations_1 = __importDefault(require("./routes/rotations"));
const events_1 = __importDefault(require("./routes/events"));
const gmail_1 = __importDefault(require("./routes/gmail"));
const cronService_1 = require("./services/cronService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));
app.use("/members", members_1.default);
app.use("/rotations", rotations_1.default);
app.use("/events", events_1.default);
app.use("/gmail", gmail_1.default);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    (0, cronService_1.startCronJobs)();
});
