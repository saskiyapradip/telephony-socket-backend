import mongoose, { Schema, Document } from "mongoose";

interface notification_setting_users {
  cid: String;
  uid: String;
  isgroup: Number;
  notification_mute_id: String;
  notification_mute_type: Number;
  notification_mute_date: Date;
}

export interface notification_setting_usersModel extends notification_setting_users, Document { }

const prepSchema: Schema = new Schema(
  {
    cid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "enterprise",
      required: "cid is required",
    },
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: "uid is required",
    },
    isgroup: {
      type: Number,
      default: 0
    },
    notification_mute_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: "notification_mute_id is required"
    },
    notification_mute_type: {
      type: Number,
      required: "notification_mute_type is required"
    },
    notification_mute_date: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<notification_setting_usersModel>("notification_setting_users", prepSchema);