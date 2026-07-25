import mongoose, { Document, Schema } from "mongoose";

export interface SMS {
  sms_api_name: String;
  sms_url_method: Number;
  sms_content_type: Number;
  sms_api_url: String;
  sms_keypair_value: String;
  sms_key_message_maxlength: String;
  sms_api_type: Number;
  isapi_enable: Number;
  is_deleted:Number;
  enterprise_id: mongoose.Schema.Types.ObjectId;
}

export interface SMSModel extends SMS, Document {}

const SMSSchema: Schema = new Schema(
  {
    sms_api_name: {
      type: String,
      require: true,
    },
    sms_url_method: {
      type: Number,
      require: true,
    },
    sms_content_type: {
      type: Number,
      require: true,
    },
    sms_api_url: {
      type: String,
      require: true,
    },
    sms_keypair_value: {
      type: String,
      require: true,
    },
    sms_key_message_maxlength: {
      type: String,
      require: true,
    },
    sms_api_type: {
      type: Number,
      enum:[1,2,3,4,5], // 1 for user login template 2 for enterprise creation 3 for reset password 4 for User creation
      require: true, //5 for FQDN Regenrated
    },
    isapi_enable: {
      type: Number,
      require: true,
    },
    is_deleted: {
      type: Number,
      default: 0,
    },
    enterprise_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "enterprises",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<SMSModel>("sms", SMSSchema);
