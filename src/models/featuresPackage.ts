import mongoose, { Document, Schema } from "mongoose";

export interface featuresPackage {
  feature_name:String,
  Activation_key:String,
  Deactivation_key:String,
}

export interface featuresPackageModel extends featuresPackage, Document {}

const packageSchema: Schema = new Schema(
  {
    feature_name: {
      type: String,
      require: true,
    },
    Activation_key: {
      type: String,
      require: true,
    },
    Deactivation_key: {
      type: String,
      require: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<featuresPackageModel>("featuresPackage", packageSchema);
