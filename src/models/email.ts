import mongoose, { Document, Schema } from "mongoose";

export interface Email {
    email_title:String;
    email_description:String;
    sender_name:String;
    from:String;
    replay_to:String;
    subject:String;
    message:String;
    action_url:String;
    is_deleted:Number,
    email_type:Number;
    enterprise_id:String;
}

export interface EmailModel extends Email, Document { }

const UserSchema: Schema = new Schema({
    email_title: {
        type: String,
        require: true,
    },
    email_description: {
        type: String,
        require: true,
    },
    sender_name:{
        type:String,
        default:"No Provided"
    },
    from:{
        type:String,
        require:true
    },
    replay_to:{
        type:String,
        default:"No replay"
    },
    subject:{
        type:String,
        require:true,
    },
    message:{
        type:String,
        require:true,
    },
    action_url:{
        type:String,
        default:""
    },
    is_deleted: {
        type: Number,
        default: 0,
      },
      enterprise_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"enterprises",
      default:null
    },
    email_type:{
      type:Number,
      enum:[1,2,3,4,5] // 1 for user creation 2 fdqn token reset 3 for enterprise reset password 
                        //4 for Reset Password 5 for Login verification
    }
  },
    {
        timestamps: true,
    });

export default mongoose.model<EmailModel>("email", UserSchema);


