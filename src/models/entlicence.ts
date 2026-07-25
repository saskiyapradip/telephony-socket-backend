import mongoose, { Document, Schema } from "mongoose";

export interface EntLicence {
  userName: String;
  Password: String;
  pbxcoreIpAddress:String;
  totalEnterprises:Number;
  totalSubscribers:Number;
  totalConcurrentCalls:Number;
  pbxcoreVersion:String;
}

export interface EntLicencetModel extends EntLicence, Document {}

const UserContactSchema: Schema = new Schema(
  {
    userName: {
      type:String,
      require:true
    },
    Password: {
      type: String,
      require:true
    },
    pbxcoreIpAddress:{
      type:String,
      require:true
    },
    totalEnterprises:{
      type:Number,
      require:true
    },
    totalSubscribers:{
      type:Number,
      require:true
    },
    totalConcurrentCalls:{
      type:Number,
      require:true
    },
    pbxcoreVersion:{
      type:String,
      require:true
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<EntLicencetModel>("entlicence", UserContactSchema);
