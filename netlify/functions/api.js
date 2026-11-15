// Runs the Express API as a Netlify Function, so the site and its API deploy together.
import serverless from "serverless-http";
import app from "../../server/app.js";

const run = serverless(app);

export const handler = (event, context) => {
  // Requests arrive as /api/... through the redirect in netlify.toml; direct calls use the function's own path.
  event.path = event.path.replace(/^\/\.netlify\/functions\/api/, "/api");
  return run(event, context);
};
