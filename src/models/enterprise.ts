import mongoose, { Schema, Document } from "mongoose";

export interface Enterprise {
    enterprise_name: String;
    enterprise_username: String;
    enterprise_password: String;
    enterprise_id: Number;
    noOfSubscriber: Number;
    status: String;
    createdByStaffId: Number;
    sipDomain: String;
    contactAddress: String;
    phoneNumber: String;
    emailAddress: String;
    billingAddress: String;
    logoId: Number;
    isRatingEnable: String;
    isInternalFreeCalls: String;
    entStatus: String;
    isTPREnable: String;
    concurrency: Number;
    MOHFile: String;
    mohFileName:String;
    Featurepackages: String;
    ipAddress: String;
    Port: String;
    Logo: String;
    PrimaryColor: String;
    SecondaryColor: String;
    isHosted: Number;
    is_deleted: Number;
    SecondoryPort:String;
    SecondoryipAddress:String;
    resetToken:String;
}

export interface EnterpriseModel extends Enterprise, Document { }

const prepSchema: Schema = new Schema({
    enterprise_name: {
        type: String,
        reauired: "enterprise_name is required"
    },
    enterprise_username: {
        type: String,
        reauired: "enterprise_username is required"
    },
    enterprise_password: {
        type: String,
        required: "enterprise_password is required"
    },
    enterprise_id: {
        type: Number,
        default:0
    },
    noOfSubscriber: {
        type: Number,
        default:0
    },
    status: {
        type: String,
        enum: ["A","N"],
        default: "A"
    },
    createdByStaffId: {
        type: Number,
        default:0
    },
    sipDomain: {
        type: String,
        default:""
    },
    contactAddress: {
        type: String,
        default:""
    },
    phoneNumber: {
        type: String,
        default:""
    },
    emailAddress: {
        type: String,
        default:""
    },
    billingAddress: {
        type: String,
        default:""
    },
    logoId: {
        type: Number,
        default:0
    },
    isRatingEnable: {
        type: String,
        enum: ["N", "Y"],
        default: "N"
    },
    isInternalFreeCalls: {
        type: String,
        enum: ["N", "Y"],
        default: "Y"
    },
    entStatus: {
        type: String,
        enum: ["A","N"],
        default: "A"
    },
    isTPREnable: {
        type: String,
        enum: ["N", "Y"],
        default: "N"
    },
    concurrency: {
        type: Number,
        default:0
    },
    MOHFile: {
        type: String,
        default:""
    },
    mohFileName: {
        type: String,
        default:""
    },
    Featurepackages: {
        type: String,
        default:""
    },
    ipAddress: {
        type: String,
        default:""
    },
    Port: {
        type: String,
        default:""
    },
    Logo: {
        type: String,
        default:""
    },
    PrimaryColor: {
        type: String,
        default:""
    },
    SecondaryColor: {
        type: String,
        default:""
    },
    isHosted: {
        type: Number,
        default:0
    },
    is_deleted: {
        type: Number,
        default: 0
    },
    SecondoryPort:{
        type:String,
        default:""
    },
    SecondoryipAddress:{
        type:String,
        default:""
    },
    resetToken:{
        type:String,
        default:""
    }
}, {
    timestamps: true
})

export default mongoose.model<EnterpriseModel>("enterprise", prepSchema);