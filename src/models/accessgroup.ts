import mongoose, { Document, Schema } from "mongoose";

export interface accessgroup {
    eid:any,
    name:String,
    profile_type:Number,
    dashboard_view:Number,
    enterprise_create:Number,
    enterprise_update:Number,
    enterprise_delete:Number,
    enterprise_view:Number,
    enterprise_download:Number, 
    subscriber_create:Number,
    subscriber_update:Number,
    subscriber_delete:Number,
    subscriber_view:Number,
    subscriber_download:Number,
    email_update:Number,
    email_view:Number,
    sms_update:Number,
    sms_view:Number,
    add_admin_create:Number,
    add_admin_update:Number,
    add_admin_delete:Number,
    add_admin_view:Number,
    add_role_create:Number,
    add_role_update:Number,
    add_role_delete:Number,
    add_role_view:Number,
    cdr_view:Number,
    subscriber_import:Number,
    config_smtp:Number,
    cdr_download:Number,
    provising_logs_view:Number,
    provising_logs_download:Number,
    token_regenrate:Number,
    is_deleted:Number
}

export interface accessgroupModel extends accessgroup, Document { }

const UserSchema: Schema = new Schema({
    eid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "enterprise",
        default:null
      },
    name: {
        type: String,
        require: true,
    },
    profile_type: {
        type: Number,
        enum: [1, 2], //1 for root and 2 for enterpeise
        require: true
    },
    dashboard_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    enterprise_create:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    enterprise_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    enterprise_delete:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    enterprise_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    enterprise_download:{
        type: Number,
        enum: [0, 1],   
        require: true
    },
    subscriber_create:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    subscriber_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    subscriber_delete:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    subscriber_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    subscriber_download:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    email_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    email_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    sms_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    sms_view:{
        type: Number,
        enum: [0, 1],   
        require: true
    },
    add_admin_create:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_admin_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_admin_delete:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_admin_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_role_create:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_role_update:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_role_delete:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    add_role_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    cdr_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    subscriber_import:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    config_smtp:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    cdr_download:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    provising_logs_view:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    provising_logs_download:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    token_regenrate:{
        type: Number,
        enum: [0, 1],
        require: true
    },
    is_deleted: {
        type: Number,
        enum: [0, 1],
        default: 0
      },
},
    {
        timestamps: true,
    });

export default mongoose.model<accessgroupModel>("accessgroup", UserSchema);


