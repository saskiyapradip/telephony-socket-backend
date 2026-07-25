import mongoose, { Document, Schema } from "mongoose";

export interface favcontact {
  eid:String;
  uid: String;
  contact_name:String;
  contact_number:String;
  contact_unfavorite:any;
}

export interface favcontactModel extends favcontact, Document {}

const favcontact: Schema = new Schema(
  {
    eid:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "enterprise",
      default:null
    },
    uid:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    contact_name: {
      type: String,
      default:""
    },
    contact_number: {
      type: String,
      required: "contact_number is required",
    },
    contact_unfavorite:{
      type:Number,
      default:0
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<favcontactModel>("user_fav_contact", favcontact);