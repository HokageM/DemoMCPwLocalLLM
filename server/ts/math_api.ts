import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (_req, res) => {
  res.json({
    message: "Math API is running",
    try: {
      docs: "/docs (not implemented)",
      add: { method: "POST", path: "/add", body: { a: 1, b: 2 } },
      multiply: { method: "POST", path: "/multiply", body: { a: 3, b: 4 } }
    }
  });
});

app.post("/add", (req, res) => {
  const { a, b } = req.body ?? {};
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isFinite(an) || !Number.isFinite(bn)) {
    res.status(400).json({ error: "Both a and b must be numbers" });
    return;
  }
  res.json({ operation: "add", a: an, b: bn, result: an + bn });
});

app.post("/multiply", (req, res) => {
  const { a, b } = req.body ?? {};
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isFinite(an) || !Number.isFinite(bn)) {
    res.status(400).json({ error: "Both a and b must be numbers" });
    return;
  }
  res.json({ operation: "multiply", a: an, b: bn, result: an * bn });
});

const PORT = Number(process.env.PORT ?? 3333);
app.listen(PORT, () => {
  console.log(`Math API listening on http://127.0.0.1:${PORT}`);
});
