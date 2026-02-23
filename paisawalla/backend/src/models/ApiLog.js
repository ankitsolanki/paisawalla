import mongoose from 'mongoose';

const apiLogSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      default: 'POST',
    },
    url: {
      type: String,
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    parsedResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    statusCode: {
      type: Number,
    },
    durationMs: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'api_logs',
  }
);

apiLogSchema.index({ createdAt: -1 });

const ApiLog = mongoose.model('ApiLog', apiLogSchema);

export default ApiLog;
