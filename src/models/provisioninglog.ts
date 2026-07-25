import mongoose, { Schema, Document } from "mongoose";

export interface provisioninglog {
  userId: String;
  platform: String;
  time: String;
  ip: String;
  activity: String;
  devicename: String;
  countryCode:String;
  activity_type:Number;
  email:String;
  mobilenumber:String;
}

export interface provisioninglogModel extends provisioninglog, Document {}

const provisioninglogSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    platform: {
      type: String,
      default: "",
    },
    time: {
      type: Date,
      default: null,
    },
    ip: {
      type: String,
      default: "",
    },
    activity: {
      type: String,
      default: "",
    },
    devicename: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "", // Default country code set to "US"
    },
    activity_type: {
      type: Number,
      default: 0, // Default activity type set to 0
    },
    email: {
      type: String,
      default: "",
    },
    mobilenumber: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<provisioninglogModel>("provisioninglog", provisioninglogSchema);
