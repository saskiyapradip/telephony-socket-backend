import mongoose, { Document, Schema } from "mongoose";

export interface IncomingDid {
  IncomingDid_Number: Number;
}

export interface IncomingDidModel extends IncomingDid, Document {}

const packageSchema: Schema = new Schema(
  {
    IncomingDid_Number: {
      type: Number,
      require: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IncomingDidModel>("IncomingDid", packageSchema);
