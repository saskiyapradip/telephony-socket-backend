import mongoose, { Document, Schema } from "mongoose";

export interface smsconfig {
  sms_api_name: String;
  sms_url_method:Number;
  sms_count_type:Number;
  sms_api_url:String;
  sms_keypair_value:String;
  sms_key_receiver:String;
  sms_key_message:String;
  sms_key_message_maxlength:String;
  isapi_enable: number;
}

export interface smsconfigModel extends smsconfig, Document {}

const smsconfig: Schema = new Schema(
  {
  sms_api_name: {
      type:String
    },
  sms_url_method:{
    type:Number,
    enum:[1,2], // 1for get 2 for post
    required: true,
  },
  sms_count_type:{
    type:Number,
    enum:[1,2], //1 for plain text 2 for json
    required: true,
  },
  sms_api_url:{
    type:String,
    required: true,
  },
  sms_keypair_value:{
    type:String,
    required: true,
  },
  sms_key_receiver:{
    type:String,
    required: true,
  },
  sms_key_message:{
    type:String,
    required: true,
  },
  sms_key_message_maxlength:{
    type:String,
    required: true,
  },
  isapi_enable:{
    type:Number,
    default:0
  },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<smsconfigModel>("smsconfig", smsconfig);