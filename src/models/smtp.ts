import mongoose, { Document, Schema } from "mongoose";

export interface SMTP {
  mail_host: string;
  is_auth: number;
  auth_user: string;
  auth_password: string;
  auth_method: number;
  start_tls: number;
  tls: number;
}

export interface SMTPModel extends SMTP, Document {}

const SMTPSchema: Schema = new Schema(
  {
    mail_host: {
      type: String,
      required: true,
    },
    is_auth: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    auth_user: {
      type: String,
      default: "",
    },
    auth_password: {
      type: String,
      default: "",
    },
    auth_method: {
      type: Number,
      enum: [1, 2, 3],//1 for none 2 for login 3 for crmmd5f
      default: 1,
    },
    start_tls: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    tls: {
      type: Number,
      enum: [0, 1],
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<SMTPModel>("smtp", SMTPSchema);