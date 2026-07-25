import mongoose, { Schema, Document } from "mongoose";

interface call_history {
  call_id:String;
  from:String;
  to:String;
  sipDomain:String;
  duration:String;
  call_time:Date;
  direction:String;
  ingressip:String;
  egressip:String;
  from_user_name:String;
  from_user_image:String;
  to_user_name:String;
  to_user_image:String;
  isvideo_call:Number;
  iscallEnded:Number;
  isinternal_call:Number;
  session_id:String;
  call_end_time:Date;
  call_start_time:Date;
}

export interface call_historyModel extends call_history, Document { }

const prepSchema: Schema = new Schema(
  {
    eid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "enterprise",
      default:null
    },
    call_id: {
      type: String,
      require: true
    },
    from: {
      type: String,
      require: true
    },
    to: {
      type: String,
      require: true
    },
    sipDomain:{
      type: String,
      require: true
    },
    duration: {
      type: String,
      require: true
    },
    call_start_time:{
      type: Date,
      default:null
    },
    call_time: {
      type: Date,
      require: true
    },
    direction: {
      type: String,
      default:"Outgoing"
    },
    ingressip: {
      type: String,
      require: true
    },
    egressip: {
      type: String,
      require: true
    },
    from_user_name:{
      type: String,
      require: true
    },
    from_user_image:{
      type: String,
      require: true
    },
    to_user_name:{
      type: String,
      require: true
    },
    to_user_image:{
      type: String,
      require: true
    },
    isvideo_call:{
      type:Number,
      enum:[0,1],//0 for audio and 1 for video
      default:0
    },
    iscallEnded:{
      type:Number,
      enum:[0,1],//0 for audio and 1 for video
      default:0
    },
    isinternal_call:{
      type:Number,
      enum:[0,1],//0 for extrenal call and 1 for internal call
      default:1
    },
    session_id:{
      type:String,
      require: true
    },
    call_end_time: {
      type: Date,
      default:null
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<call_historyModel>("call_history", prepSchema);

