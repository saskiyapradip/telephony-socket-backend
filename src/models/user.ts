import mongoose, { Document, Schema } from "mongoose";

export interface User {
  eid: String;
  subscriberId:Number,
  subscriberActivate:String;
  pin:String;
  suspendStatus:String;
  enterprise_id:Number;
  accountType:String;
  packageName:String;
  borderAgent:Number;
  endpointNumber:String;
  callerId:String;
  internalCallerID:String;
  emailAddress:String;
  units:Number;
  creditLimit:Number;
  isVoiceMailEnable:String;
  incommingDIDNumbers:String;
  stdpassword:String;
  sipDomain:String;
  MobileNumber:String;
  subscriberGroup:String;
  vmsPassword:Number;
  first_name: String;
  last_name: String;
  password: String;
  user_image: String;
  is_deleted: Number;
  user_custome_msg: String;
  is_online: Number;
  push_token: String;
  selector: String;
  isguest: Number;
  guest_expire_time: Date;
  conversation_deleted_users: String;
  last_seen: Date;
  user_devices: Number;
  user_type: Number;
  fqdn_token:String;
  otp:String;
}

export interface UserModel extends User, Document { }

const UserSchema: Schema = new Schema({
  eid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "enterprise",
    default:null
  },
  subscriberId:{
    type:Number,
    default:0
   },
  subscriberActivate:{
    type:String,
    enum:["Y","N"],
    default:"Y"
  },
  pin:{
    type:String,
    default:""
  },
  suspendStatus:{
    type:String,
    enum:["Y","N"],
    default:"N"
  },
  enterprise_id:{
    type:Number,
    default:0
  },
  accountType:{
    type:String,
    default:""
  },
  packageName:{
    type:String,
    default:""
  },
  borderAgent:{
    type:Number,
    default: 0,
  },
  endpointNumber:{
    type:String,
    default:""
  },
  callerId:{
    type:String,
    default:""
  },
  internalCallerID:{
    type:String,
    default:""
  },
  emailAddress:{
    type:String,
    default:""
  },
  units:{
    type:Number,
    default:0
  },
  creditLimit:{
    type:Number,
    default:0
  },
  isVoiceMailEnable:{
    type:String,
    enum:["on","off"],
    default:"off"
  },
  incommingDIDNumbers:[
    {
      type:String
    }
  ],
  stdpassword:{
    type:String,
    default:"000"
  },
  sipDomain:{
    type:String,
    default:""
  },
  MobileNumber:{
    type:String,
    default:""
  },
  subscriberGroup:{
    type:String,
    default:""
  },
  vmsPassword:{
    type:Number,
    default:0
  },
  first_name: {
    type: String,
    required: "first_name is required",
  },
  last_name: {
    type: String,
    required: "last_name is required",
  },
  password: {
    type: String,
    required: "password is required",
  },
  user_image: {
    type: String,
    default: "",
  },
  is_deleted: {
    type: Number,
    default: 0,
  },
  user_custome_msg: {
    type: String,
    default: "",
  },
  is_online: {
    type: Number,
    default: 0,
  },
  isguest: {
    type: Number,
    default: 0
  },
  guest_expire_time: {
    type: Date,
    default: null
  },
  conversation_deleted_users: [{
    type: String
  }],
  last_seen: {
    type: Date,
    default: null
  },
  user_devices: {
    type: Number,
    default: 0
  },
  user_type: {
    type: Number,
    enum: [1, 2, 3, 4],
    require: true
  },
  fqdn_token:{
    type:String,
    default:""
  },
  otp:{
    type:String,
    default:""
  }
},
  {
    timestamps: true,
  });

export default mongoose.model<UserModel>("user", UserSchema);


