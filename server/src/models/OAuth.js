import mongoose from "mongoose";

const OAuthClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  name: { type: String, required: true }, // e.g., "Notion AI" or "Cursor MCP"
  redirectUris: { type: [String], required: true },
  grants: { type: [String], default: ["authorization_code", "refresh_token"] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const OAuthAuthCodeSchema = new mongoose.Schema({
  authorizationCode: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  redirectUri: { type: String, required: true },
  clientId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

// TTL index to automatically delete expired auth codes
OAuthAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true, unique: true },
  accessTokenExpiresAt: { type: Date, required: true },
  refreshToken: { type: String, unique: true, sparse: true },
  refreshTokenExpiresAt: { type: Date },
  clientId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

// TTL index to automatically delete expired tokens
OAuthTokenSchema.index({ accessTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthClient = mongoose.models.OAuthClient || mongoose.model("OAuthClient", OAuthClientSchema);
export const OAuthAuthCode = mongoose.models.OAuthAuthCode || mongoose.model("OAuthAuthCode", OAuthAuthCodeSchema);
export const OAuthToken = mongoose.models.OAuthToken || mongoose.model("OAuthToken", OAuthTokenSchema);
