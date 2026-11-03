import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks;


export async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in first" });

    jwks ??= createRemoteJWKSet(new URL(process.env.JWKS_URL));
    const { payload } = await jwtVerify(token, jwks);

    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    if (!req.user.email) return res.status(401).json({ message: "Invalid token" });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
