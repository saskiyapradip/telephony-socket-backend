import mongoose, { Document, Schema } from "mongoose";

export interface entPackage {
  package_name: String;
}

export interface entPackageModel extends entPackage, Document {}

const packageSchema: Schema = new Schema(
  {
    package_name: {
      type: String,
      require: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<entPackageModel>("entPackage", packageSchema);
