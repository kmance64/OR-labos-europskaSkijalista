import { auth } from "express-oauth2-jwt-bearer";

export const checkJwt = auth({
  audience: "https://skijalista-api",
  issuerBaseURL: "https://dev-4w7gzuvyminy3ghu.us.auth0.com/",
  tokenSigningAlg: "RS256"
});
