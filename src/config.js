// DEMO ONLY - these are fake credentials planted for secret-scanning demos.
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: "acme-super-secret-jwt-key-2024",
  dbPassword: "Pr0d_DB_P@ssw0rd!",
  aws: {
    accessKeyId: "AKIA4ZQ7XK2M9PLR3TYV",
    secretAccessKey: "q8Zr3Kx9mT2vLp7WnB4cY6hJ1sDfG5aE0uRiOkPz",
    region: "us-east-1",
  },
  slackWebhook: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  // Dangerous endpoints (command exec, template RCE) stay off unless explicitly enabled,
  // so the app is safe(r) to expose publicly for DAST. SAST still sees the code.
  enableRceEndpoints: process.env.ENABLE_RCE_ENDPOINTS === "true",
};
