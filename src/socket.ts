import user from "./models/user";
import group from "./models/group";
import conversation from "./models/conversation";
import group_conversation from "./models/group_conversation";
import group_message_status from "./models/group_message_status";
import group_members from "./models/group_members";
import { MESSAGE } from "./constant";
import moment from "moment";
import { Server } from "socket.io";
import user_block from "./models/user_block";
import sendPushNotification from "./helper/sendPushNotification";
import call_history from "./models/call_history";
import user_tokens from "./models/user_tokens";
import notification_setting_users from "./models/notification_setting_users";
import mongoose from "mongoose";
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import {decrypt,encrypt} from "./helper/encreptdecreptMessage";

let io: any;
let socket_users: any[] = [];

export const connect = async (server: any) => {
  io = new Server(server, {
    allowEIO3: true,
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket: any) => {
    if (socket.handshake.query.cid != null && socket.handshake.query.cid != undefined && socket.handshake.query.uid != null && socket.handshake.query.uid != undefined && socket.handshake.query.cid && socket.handshake.query.uid
      && socket.handshake.query.uid.length !== 0 && socket.handshake.query.cid.length !== 0 && socket.handshake.query.device_id != null && socket.handshake.query.last_message_time != null && socket.handshake.query.device_id != undefined && socket.handshake.query.last_message_time != undefined) {
      var socket_obj = {
        cid: socket.handshake.query.cid,
        uid: socket.handshake.query.uid,
        socket_id: socket.id,
        device_id:socket.handshake.query.device_id
      };
 
     let create_uid:any =new mongoose.Types.ObjectId(socket.handshake.query.uid) 

      await user.findByIdAndUpdate(
        {
          _id: create_uid,
        },
        {
          is_online: 1
        },
        {
          new: true,
          runValidators: true,
        }
      );
     
      let find_user_already:any []=  socket_users.filter(rows=>rows.device_id.toString() == socket.handshake.query.device_id.toString() && rows.uid.toString() == socket.handshake.query.uid.toString())
       
     if(find_user_already.length == 0){
     
      socket_users.push(socket_obj)
     }else{
     
      let check_user_already:any []= socket_users.filter(rows=>rows.device_id.toString() !== socket.handshake.query.device_id.toString())
     
      socket_users = check_user_already
      socket_users.push(socket_obj)
     }
    
      const mySocketIds: any[] = [];
      const MySocketid: any[] = []
      await Promise.all(
        socket_users.map(async (item) => {
          if (
            item.uid !== socket.handshake.query.uid &&
            item.cid === socket.handshake.query.cid
          ) {
            mySocketIds.push(item.socket_id);
          }
          if (item.uid == socket.handshake.query.uid &&
            item.cid === socket.handshake.query.cid) {
            MySocketid.push(item.socket_id);
          }
        })
      );
      let post = {
        _id: socket.handshake.query.uid,
        is_online: 1,
        last_seen: null
      };
      if (mySocketIds.length > 0) {
        io.to(mySocketIds).emit("send_online_status", post);
      }
      let tmp_date:any = moment(socket.handshake.query.last_message_time,"YYYY-MM-DDTHH:mm:ss.sss").isValid();
      if(tmp_date){
        let last_message_time:any = moment(socket.handshake.query.last_message_time,"YYYY-MM-DDTHH:mm:ss.sss").format("YYYY-MM-DDTHH:mm:ss.sssZ")
        let get_year:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("YYYY")
        let get_month:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("MM")
        let get_day:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("DD")
        let get_hour:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("HH")
        let get_minutes:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("mm")
        let get_seconds:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("ss")
        let get_miliseconds:any = moment(last_message_time,"YYYY-MM-DDTHH:mm:ss.sssZ").format("sss")

        let get_int_month:any = parseFloat(get_month) - 1

       
       let new_tmp_date:any = new Date();
       new_tmp_date.setUTCFullYear(get_year)
       new_tmp_date.setUTCMonth(get_int_month)
       new_tmp_date.setUTCDate(get_day)
       new_tmp_date.setUTCHours(get_hour)
       new_tmp_date.setUTCMinutes(get_minutes)
       new_tmp_date.setUTCSeconds(get_seconds)
       new_tmp_date.setUTCMilliseconds(get_miliseconds)
       last_message_time = new_tmp_date
       last_message_time = new Date(last_message_time)
       
      const getSenderList = await conversation.find({
        is_deleted: 0,
        $or: [
          { receiver_id: create_uid },
          { sender_id:create_uid }
        ],
        delete_message_users: { $ne: create_uid },
        createdAt:{$gt:new Date(last_message_time)}
      });
      let get_group_msg: any[] = await group_message_status.find({
        $or: [
          { receiver_id: create_uid },
          { sender_id:create_uid }
        ],
        createdAt:{$gte:new Date(last_message_time)}
      }).distinct("message_id")

      let get_group_mes_detail: any[] = await group_conversation.find({
        _id: { $in: get_group_msg },
        delete_message_users: { $ne: create_uid },
        createdAt:{$gte:new Date(last_message_time)}
      })
      const myACKSocketIds: any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === create_uid.toString() && item.cid.toString() === socket.handshake.query.cid.toString() && item.device_id.toString() === socket.handshake.query.device_id.toString()) {
            myACKSocketIds.push(item.socket_id);
          }
        })
      );
      if (myACKSocketIds.length > 0) {
        if(getSenderList.length > 0){
          await Promise.all(
            getSenderList.map(async (item: any) => {
              let get_user_detail: any = await user.findOne({
                _id: item.sender_id
              })
  
              socket_users.map(async (row: any) => {
                if (!item.delete_message_users.includes(row.uid.toString()) && row.uid.toString() === item.receiver_id.toString() && row.uid.toString() != item.sender_id && row.cid.toString() === item.cid.toString()  && row.device_id.toString() === socket.handshake.query.device_id.toString()) {
                 
                  let post: any = item.toObject();
              
                  let sender_detail:any = {
                    name:get_user_detail.first_name +" "+get_user_detail.last_name,
                    image:get_user_detail.user_image
                  }
    
                    io.to(row.socket_id).emit("receive_message", {
                      message_detail:post,
                      isgroup:0,
                      sender_detail:sender_detail
                    });
                  
                }
                if (!item.delete_message_users.includes(row.uid.toString()) && row.uid.toString() !== item.receiver_id.toString() && row.uid.toString() === item.sender_id.toString() && row.cid.toString() === item.cid.toString()  && row.device_id.toString() === socket.handshake.query.device_id.toString()) {
                  let get_user_detail_sender:any = await user.findById({
                    _id:item.receiver_id,
                  })
                   let originalName_sender:any = "";
                  if(get_user_detail_sender){
                    originalName_sender = get_user_detail_sender.first_name +" "+get_user_detail_sender.last_name;
                  }
                  let post: any = item.toObject();
                  post.receiver_nm = originalName_sender
                  let sender_detail:any = {
                    name:get_user_detail.first_name +" "+get_user_detail.last_name,
                    image:get_user_detail.user_image
                  }
    
                    io.to(row.socket_id).emit("ack_send_message", {
                      message_detail:post,
                      isgroup:0,
                      sender_detail:sender_detail
                    });
                  
                }
              })
            }))
        }
  
        if(get_group_mes_detail.length > 0){
          await Promise.all(
            get_group_mes_detail.map(async (item: any) => {
              let get_group_dteail: any = await group.findById({
                _id: item.group_id
              })
              socket_users.map(async (row: any) => {
                if (get_group_dteail.group_users.includes(row.uid.toString()) && row.uid.toString() != item.sender_id && row.cid.toString() === item.cid.toString() && row.device_id.toString() === socket.handshake.query.device_id.toString()) {
                  let post: any = item.toObject();
                  let get_sender_detail:any = await user.findById({
                    _id:item.sender_id,
                    is_deleted:0
                  }).select("first_name last_name")
    
                  if(get_sender_detail){
                    post.sender_id = get_sender_detail
                  }
                  let sender_detail:any = {
                    name:get_group_dteail.group_name,
                    image:get_group_dteail.group_image
                  }
                  io.to(row.socket_id).emit("receive_message", {
                    message_detail:post,
                    isgroup:1,
                    sender_detail:sender_detail
                  });
                }
                if (get_group_dteail.group_users.includes(row.uid.toString()) && row.uid.toString() === item.sender_id.toString() && row.cid.toString() === item.cid.toString() && row.device_id.toString() === socket.handshake.query.device_id.toString()) {
                  let post: any = item.toObject();
                  let get_sender_detail:any = await user.findById({
                    _id:item.sender_id
                  }).select("first_name last_name")
    
                  if(get_sender_detail){
                    post.sender_id = get_sender_detail
                  }
                  let sender_detail:any = {
                    name:get_group_dteail.group_name,
                    image:get_group_dteail.group_image
                  }
                  io.to(row.socket_id).emit("ack_send_message", {
                    message_detail:post,
                    isgroup:1,
                    sender_detail:sender_detail
                  });
                }
              })
            }))
        }
      }
      }
    socket.on("send_message",async (data:any) =>{
      try {
        console.log("send_message socket emited")
          let isgroup:any = data.isgroup
          let cid:any = data.cid
          let sender_id:any = data.sender_id
          let receiver_id:any = data.receiver_id
          let message:any =data.message
          let group_id:any = data.group_id
          let post: any;
          let reciver_ids_arr:any[] = [];
          let left_group_member:any[] = [];
          let sender_detail:any;
          let isblock:any = false

          if(isgroup !== undefined && isgroup !== null && isgroup == 0 && cid !== undefined && sender_id !== undefined &&receiver_id !== undefined && message !== undefined && receiver_id !== null){
  
            let get_user_detail:any = await user.findById({
              _id:sender_id,
              is_deleted:0
            })
            let originalName_tmp:any = "";
            let originalImage_tmp:any = "";
            let sender_endpointnumber:any = "";
            if(get_user_detail){
              originalName_tmp = get_user_detail.first_name +" "+get_user_detail.last_name;
              originalImage_tmp = get_user_detail.user_image
              sender_detail = {
                name:get_user_detail.first_name +" "+get_user_detail.last_name,
                image:get_user_detail.user_image
              }
              sender_endpointnumber = get_user_detail.endpointNumber
            }
             let get_user_detail_sender:any = await user.findById({
              _id:receiver_id,
              is_deleted:0
            })
             let originalName_sender:any = "";
            
            if(get_user_detail_sender){
              originalName_sender = get_user_detail_sender.first_name +" "+get_user_detail_sender.last_name;
              sender_detail = {
                name:get_user_detail_sender.first_name +" "+get_user_detail_sender.last_name,
                image:get_user_detail_sender.user_image
              }
            }

            let check_user_delted_chat_sender:any = await user.findOneAndUpdate({
              _id:receiver_id,
              conversation_deleted_users:{$in:[sender_id]}
            },{
              $pull: { conversation_deleted_users: sender_id }
            },{
              runValidators:true
            })


            let check_user_delted_chat_reciver:any = await user.findOneAndUpdate({
              _id:sender_id,
              conversation_deleted_users:{$in:[receiver_id]}
            },{
              $pull: { conversation_deleted_users: receiver_id }
            },{
              runValidators:true
            })

  
            let get_check_block_by_reciver:any = await user_block.findOne({
              block_by:receiver_id,
              block_id:sender_id
            })
            let delete_mesage_arr:any [] = [];
            if(get_check_block_by_reciver){
              isblock = true
              delete_mesage_arr.push(receiver_id)
            }
            let message_caption_tmp:any = "";
            if(data.media_type == 1 || data.media_type == 2){
              message_caption_tmp = data.message_caption 
            }
  
            post = new conversation();
            post.cid = cid;
            post.sender_id = sender_id;
            post.receiver_id = receiver_id;
            post.originalName = originalName_tmp ? originalName_tmp : "";
            post.message = message;
            post.message_type = parseInt(data.message_type)
              ? parseInt(data.message_type)
              : MESSAGE.MESSAGE_TYPES.REGULAR;
            post.media_type = parseInt(data.media_type)
              ? parseInt(data.media_type)
              : MESSAGE.MESSAGE_MEDIA_TYPES.TEXT;
            post.reply_message_id = data.reply_message_id
              ? data.reply_message_id
              : "";
            post.schedule_time = data.schedule_time ? data.schedule_time : null;
            post.delivery_type = MESSAGE.MESSAGE_DELIVERY_STATUS.SENDED;
            post.delete_message_users = delete_mesage_arr;
            post.block_message_users = delete_mesage_arr;
            post.message_caption = message_caption_tmp
            await post.save();
  
            post = post.toObject();
            post.tmp_message_id = data.tmp_message_id ? data.tmp_message_id : null
            post.receiver_nm = originalName_sender
            post.sender_endpointnumber = sender_endpointnumber
            post.original_image = originalImage_tmp
  
            reciver_ids_arr.push(receiver_id.toString())
          }
          if(isgroup !== undefined && isgroup == 1 && sender_id !== undefined && group_id !== undefined && group_id !== null){
              let check_group_id:any = await group.findById({
                _id:group_id
              })
              if(check_group_id){
                let get_user_detail:any = await user.findById({
                  _id:sender_id,
                  is_deleted:0
                })
                let originalName_tmp:any = ""
                if(get_user_detail){
                  originalName_tmp =check_group_id.group_name;
                  sender_detail = {
                    name:check_group_id.group_name,
                    image:check_group_id.group_image
                  }
                }
                let message_caption_tmp:any = "";
            if(data.media_type == 1 || data.media_type == 2){
              message_caption_tmp = data.message_caption 
            }
                post = new group_conversation();
                post.cid = cid;
                post.group_id = group_id;
                post.sender_id = sender_id;
                post.originalName = originalName_tmp ? originalName_tmp : "";
                post.message = message || "";
                post.message_type = data.message_type
                  ? data.message_type
                  : MESSAGE.MESSAGE_TYPES.REGULAR;
                post.media_type = data.media_type
                  ? data.media_type
                  : MESSAGE.MESSAGE_MEDIA_TYPES.TEXT;
                post.reply_message_id = data.reply_message_id
                  ? data.reply_message_id
                  : "";
                post.schedule_time = data.schedule_time ? data.schedule_time : null;
                post.message_caption = message_caption_tmp
                await post.save();
  
                post = post.toObject();
                post.tmp_message_id = data.tmp_message_id ? data.tmp_message_id : null
                post.sender_endpointnumber = ""
                post.group_image = check_group_id ? check_group_id.group_image : "";
                let get_sender_detail:any = await user.findById({
                  _id:sender_id,
                  is_deleted:0
                }).select("first_name last_name")
  
                if(get_sender_detail){
                  post.sender_id = get_sender_detail
                }
  
                let groupUsersData:any [] = [];
                if(check_group_id){
                  groupUsersData = check_group_id.group_users
                }
                if (groupUsersData.length > 1) {
                  await Promise.all(
                    groupUsersData.map(async (mapId: any) => {
                      if(mapId.toString() !== sender_id.toString()){
                        const messageAdd = new group_message_status();
                        messageAdd.cid = cid;
                        messageAdd.group_id = group_id;
                        messageAdd.message_id = post._id;
                        messageAdd.receiver_id = mapId;
                        messageAdd.sender_id = sender_id;
                        messageAdd.save();
                      }
                    })
                  );
                }
                reciver_ids_arr = check_group_id.group_users
                left_group_member = check_group_id.group_leave_members
              }
          }
          const sendrSocketIds: any[] = [];
          const ReciverSocketIds:any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (item.uid.toString() === sender_id.toString() && item.cid.toString() === cid.toString()) {
              sendrSocketIds.push(item.socket_id);
            }
            if(item.uid.toString() !== sender_id.toString() && !left_group_member.includes(item.uid) && reciver_ids_arr.includes(item.uid) && item.cid.toString() === cid.toString()){
  
              ReciverSocketIds.push(item.socket_id)
            }
          })
        );
        if(sendrSocketIds.length > 0){
          io.to(sendrSocketIds).emit("ack_send_message", {
            message_detail:post,
            isgroup:isgroup,
            sender_detail:sender_detail
          });
        }
        if(ReciverSocketIds.length > 0 && !isblock){
          io.to(ReciverSocketIds).emit("receive_message", {
            message_detail:post,
            isgroup:isgroup,
            sender_detail:sender_detail
          });
        }
  
  
        let get_token_users: any[] = [];
        let title_name: string = "";
        let notification_type:any = 0
        let notification_id:any = "";
        
        if(isgroup && data.group_id !== undefined){
          notification_type = MESSAGE.PUSH_NOTIFICATION_TYPE.GROUP.toString()
          notification_id = data.group_id.toString()
          let get_group_detail:any = await group.findById({
            _id:data.group_id
          })
          if(get_group_detail){
            title_name = get_group_detail.group_name
          }
          await Promise.all(reciver_ids_arr.map(async (row: any) => {
            let user_mute_notificaion_detail = await notification_setting_users.findOne({
              notification_mute_id: data.group_id,
              uid: row,
              notification_mute_type: { $ne: 4 },
              isgroup: 1
            })
            if (user_mute_notificaion_detail == null && sender_id.toString() !== row.toString()) {
              get_token_users.push(row)
            }
          }))
        }
        if(isgroup == 0 && sender_id !== undefined && !isblock){
          notification_id = sender_id.toString()
          notification_type = MESSAGE.PUSH_NOTIFICATION_TYPE.ONETOONE.toString()
          let get_user_detail:any = await user.findById({
            _id:sender_id
          })
          if(get_user_detail){
            title_name = get_user_detail.first_name + " " + get_user_detail.last_name
          }
          await Promise.all(reciver_ids_arr.map(async (row: any) => {
            let user_mute_notificaion_detail = await notification_setting_users.findOne({
              notification_mute_id: sender_id,
              uid: row,
              notification_mute_type: { $ne: 4 },
              isgroup: 0
            })
            if (user_mute_notificaion_detail == null) {
              get_token_users.push(row)
            }
          }))
        }
        let getpushtokens = await user_tokens.find({
          uid: { $in: get_token_users },
          push_token: { $ne: "" }
        })
        let tmp_tokens: any[] = [];
        if (getpushtokens.length > 0) {
          await Promise.all(getpushtokens.map(async (items: any) => {
            tmp_tokens.push(items.push_token)
          }))
        }
  
        
        let title: any = title_name;
        let body: any = post.message.toString();
        let token: any[] = tmp_tokens
  
          if (data.media_type == 1) {
            body = "Image"
          } else if (data.media_type == 2) {
            body = "Video"
          } else if (data.media_type == 3) {
            body = "Audio"
          } else if (data.media_type == 4) {
            body = "Documentes"
          } else if (data.media_type == 5) {
            body = "Contact"
          } else if (data.media_type == 6) {
            body = "Location"
          } else {
            const decrypted_message = await decrypt(post.message,cid);
            body = decrypted_message.toString();
          }
  
          if (token.length > 0) {
            let notification_data: any = {
              type:notification_type,
              id: notification_id,
              roomid: "",
              message:JSON.stringify(post)
            }
            sendPushNotification(title, body, token, notification_data);
        }
        
      } catch (error:any) {
        if(data.sender_id !== undefined && data.sender_id !== null ){
          const emiter_arr:any [] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (item.uid.toString() === data.sender_id.toString()) {
              emiter_arr.push(item.socket_id);
            }
          })
        );
        if(emiter_arr.length > 0){
          let get_error:any = JSON.stringify(error.toString())
          io.to(emiter_arr).emit("Socket_emit_error",get_error);
        }
        }
      }
    })
    socket.on("send_delivery_status", async function (data: any) {
      try {
      if (data) {
        let isgroup:any = data.isgroup
        let message_id:any = data.message_id
        let group_id:any = data.group_id
        let receiver_id:any = data.receiver_id
        let cid:any = data.cid
        let post:any;
        let reciver_ids:any = [];
        let sender:any;
        if(isgroup !== undefined && isgroup && group_id !== null){
          let update_obj:any = {
            delivery_type: data.delivery_type
                ? parseInt(data.delivery_type)
                : MESSAGE.MESSAGE_DELIVERY_STATUS.NOTHING,
          }
          if(data.delivery_type == 2){
            update_obj.delivery_time = new Date()
          }else if(data.delivery_type == 3){
            update_obj.read_time = new Date()
          }else{
            update_obj.delivery_time = null
            update_obj.read_time = null
          }
          await group_message_status.findOneAndUpdate(
            {
              message_id: message_id,
              group_id:group_id,
              receiver_id:receiver_id
            },
            update_obj,
            {
              new: true,
              runValidators: true,
            }
          );

          let get_message_all_count:any = await group_message_status.find({
            message_id:message_id
          }).countDocuments();

          let get_message_deliver_count:any = await group_message_status.find({
            message_id:message_id,
            delivery_type:2
          }).countDocuments();

          let get_message_read_count:any = await group_message_status.find({
            message_id:message_id,
            delivery_type:3
          }).countDocuments();

          let get_message_delivery_type:any = await group_conversation.findById({
            _id:message_id
          })
          let deliver_type_tmp:any = 1;

          if(get_message_delivery_type){
            deliver_type_tmp = get_message_delivery_type.delivery_type
          }

          if(get_message_all_count == get_message_deliver_count){
            deliver_type_tmp = 2
          }
          if(get_message_all_count == get_message_read_count){
            deliver_type_tmp = 3
          }

          post =  await group_conversation.findByIdAndUpdate({
            _id:message_id
          },
          {
            delivery_type:deliver_type_tmp
          },
          {
            new:true
          })

          let get_group_detail:any = await group.findById({
            _id:group_id
          })

          if(get_group_detail){
            reciver_ids = get_group_detail.group_users
          }
          sender = post.sender_id
        }else{
          post = await conversation.findByIdAndUpdate(
            {
              _id: message_id,
            },
            {
              delivery_type: data.delivery_type
                ? parseInt(data.delivery_type)
                : MESSAGE.MESSAGE_DELIVERY_STATUS.SENDED,
            },
            {
              new: true,
              runValidators: true,
            }
          );
          sender = post.sender_id
          reciver_ids.push(post.receiver_id.toString())
        }
       

        const sendrSocketIds: any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === sender.toString() && item.cid.toString() === cid.toString()) {
            sendrSocketIds.push(item.socket_id);
          }
          if(item.uid.toString() !== sender.toString() && reciver_ids.includes(item.uid) && item.cid.toString() === cid.toString()){
            let get_message_status:any = await group_message_status.findOne({
              message_id:message_id,
              receiver_id:item.uid.toString()
            });
            io.to(item.socket_id).emit("receive_delivery_status", {
              post:post,
              isgroup:isgroup,
              message_read_info:get_message_status
            });
          }
        })
      );
        if (sendrSocketIds.length > 0) {
          io.to(sendrSocketIds).emit("ack_send_delivery_status", {
            post:post,
            isgroup:isgroup
          });
        }
      }
      } catch (error:any) {
        if(data.sender_id !== undefined && data.sender_id !== null ){
          const emiter_arr:any [] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (item.uid.toString() === data.sender_id.toString()) {
              emiter_arr.push(item.socket_id);
            }
          })
        );
        if(emiter_arr.length > 0){
          let get_error:any = JSON.stringify(error.toString())
          io.to(emiter_arr).emit("Socket_emit_error",get_error);
        }
        }
      }
    });
    socket.on("delete_message", async function (data: any) {
      if (data) {
        let isDeleteForMe:any = data.isDeleteForMe;
        let receiver_id:any = data.receiver_id;
        let sender_id:any = data.sender_id;
        let group_users:any[] = [sender_id, receiver_id];
        let message_ids:any [] = data.message_ids;
        let isgroup:any = data.isgroup
        let deleted_messages:any[] = [];
        let group_id:any = data.group_id
        let reciver_arr:any [] = []; 
        let cid:any = data.cid;
        if(isgroup && group_id !== undefined && group_id !== null && message_ids.length > 0){
          let get_group_detail:any = await group.findById({
            _id:group_id
          })
          let group_users_list:any [] = [];
          if(get_group_detail){
            group_users_list = get_group_detail.group_users
          }
          let message_delete_arr:any [] = [];
          if(isDeleteForMe == 1){
            message_delete_arr.push(sender_id)
          }else if(isDeleteForMe == 2){
            message_delete_arr = group_users_list
          }else{
            message_delete_arr = []
          }

          if(message_ids.length > 0 && isDeleteForMe == 1){
            await group_conversation.updateMany({
              _id:{$in:message_ids}
            },
            {
              delete_message_users:message_delete_arr
            },
            {
              new:true
            })
            deleted_messages = await group_conversation.find({
              _id:{$in:message_ids}
            })
            reciver_arr = group_users_list
          }
          if(message_ids.length > 0 && isDeleteForMe == 2){
            await group_conversation.updateMany({
              _id:{$in:message_ids}
            },
            {
              delete_message_users:message_delete_arr,
              is_deleted:1
            },
            {
              new:true
            })
            deleted_messages = await group_conversation.find({
              _id:{$in:message_ids}
            })
            reciver_arr = group_users_list
          }
        }
        if(isgroup == 0 && sender_id !== undefined && receiver_id !== undefined && sender_id !== null && receiver_id !== null &&  message_ids.length > 0){
          let message_delete_arr:any [] = [];
          if(isDeleteForMe == 1){
            message_delete_arr.push(sender_id)
          }else if(isDeleteForMe == 2){
            message_delete_arr = group_users
          }else{
            message_delete_arr = []
          }
          if(message_ids.length > 0 && isDeleteForMe == 1){
           await conversation.updateMany({
              _id:{$in:message_ids}
            },
            {
              delete_message_users:message_delete_arr
            },
            {
              new:true
            })
            deleted_messages = await conversation.find({
              _id:{$in:message_ids}
            })
            reciver_arr.push(receiver_id.toString())
          }

          if(message_ids.length > 0 && isDeleteForMe == 2){
            await conversation.updateMany({
               _id:{$in:message_ids}
             },
             {
               delete_message_users:message_delete_arr,
               is_deleted:1
             },
             {
               new:true
             })
             deleted_messages = await conversation.find({
               _id:{$in:message_ids}
             })
             reciver_arr.push(receiver_id.toString())
           }
        }

                

        const sendrSocketIds: any[] = [];
        const ReciverSocketIds:any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === sender_id.toString() && item.cid.toString() === cid.toString()) {
            sendrSocketIds.push(item.socket_id);
          }
          if(item.uid.toString() !== sender_id.toString() && reciver_arr.includes(item.uid) && item.cid.toString() === cid.toString()){
            ReciverSocketIds.push(item.socket_id)
          }
        })
      );
        if (sendrSocketIds.length > 0) {
          io.to(sendrSocketIds).emit("ack_delete_message", {
            Deleted_messages:deleted_messages,
            isgroup:isgroup,
            sender_id:sender_id,
            receiver_id:receiver_id,
            group_id:group_id
          });
        }
        if (ReciverSocketIds.length > 0 && isDeleteForMe == 2) {
          io.to(ReciverSocketIds).emit("receive_delete_message", {
            Deleted_messages:deleted_messages,
            isgroup:isgroup,
            sender_id:sender_id,
            receiver_id:receiver_id,
            group_id:group_id
          });
        }
      }
    });
    socket.on("send_edit_message", async function (data: any) {
      if (data) {
        let isgroup: any = data.isgroup
        let message_id:any = data.message_id
        let group_id:any = data.group_id
        let uid:any = data.uid
        let cid:any = data.cid
        let post: any;
        let reciver_ids_arr:any[] = []
        if (isgroup && message_id !== undefined && message_id !== null && uid !== undefined && uid !== null && group_id !== undefined && group_id !== null) {
          post = await group_conversation.findOneAndUpdate(
            {
              _id:message_id,
             sender_id:uid
            },
            {
              message:data.message,
              is_edited:1
            },
            {
              new: true,
              runValidators: true,
            }
          );
          let check_group_id:any = await group.findById({
            _id:group_id
          })
          if(check_group_id){
            reciver_ids_arr = check_group_id.group_users  
          }
        } else if(isgroup == 0 && message_id !== null && uid !== null && message_id !== undefined && uid !== undefined){
          post = await conversation.findOneAndUpdate(
            {
              _id: message_id,
              sender_id:uid
            },
            {
              message: data.message,
              is_edited:1
            },
            {
              new: true,
              runValidators: true,
            }
          );
          if(post){
            reciver_ids_arr.push(post.receiver_id.toString())
          }
        }else{
          reciver_ids_arr = []
        }
        const sendrSocketIds: any[] = [];
        const ReciverSocketIds:any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === uid.toString() && item.cid.toString() === cid.toString()) {
            sendrSocketIds.push(item.socket_id);
          }
          if(item.uid.toString() !== uid.toString() && reciver_ids_arr.includes(item.uid) && item.cid.toString() === cid.toString()){
            ReciverSocketIds.push(item.socket_id)
          }
        })
      );
      if(sendrSocketIds.length > 0){
        io.to(sendrSocketIds).emit("ack_send_edit_message", {
          message_detail:post,
          isgroup:isgroup,
          group_id:group_id
        });
      }
      if(ReciverSocketIds.length > 0){
        io.to(ReciverSocketIds).emit("receive_edit_message", {
          message_detail:post,
          isgroup:isgroup,
          group_id:group_id
        });
      }
      }
    });
    socket.on("send_block", async function (data: any) {
      if (data) {
        let cid:any = data.cid
        let block_by:any = data.block_by
        let block_id:any = data.block_id
        let isBlocked:any = data.isBlocked

        if (isBlocked !== undefined && isBlocked && block_by !== undefined && block_id !== undefined && cid !== undefined && block_by !== null && block_id !== null && cid !== null) {
          const newPost = new user_block();
          newPost.cid =cid;
          newPost.block_by = block_by;
          newPost.block_id = block_id;
          newPost.block_date = new Date();
          await newPost.save();  
          
            let get_user_detail: any = await user.findById({
              _id: block_by,
            });
            let sender_detail: any = {};
            let originalName_tmp: any = "";
            if (get_user_detail) {
              originalName_tmp =
                get_user_detail.first_name + " " + get_user_detail.last_name;
              sender_detail = {
                name:
                  get_user_detail.first_name + " " + get_user_detail.last_name,
                image: get_user_detail.user_image,
              };
            }

            let get_user_detail_reciver: any = await user.findById({
              _id: block_id,
            });
            let originalName_reciver: any = "";
            if (get_user_detail_reciver) {
              originalName_reciver =
                get_user_detail_reciver.first_name +
                " " +
                get_user_detail_reciver.last_name;
            }
            let message_tmp: any = "You blocked " + originalName_reciver;

            let delete_mesage_arr: any[] = [block_id];
            let mesage_info = new conversation();
            mesage_info.cid = cid;
            mesage_info.sender_id = block_by;
            mesage_info.receiver_id = block_id;
            mesage_info.originalName = originalName_tmp ? originalName_tmp : "";
            mesage_info.message = await encrypt(message_tmp,cid);
            mesage_info.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
            mesage_info.media_type = MESSAGE.MESSAGE_MEDIA_TYPES.INFO;
            mesage_info.reply_message_id = "";
            mesage_info.schedule_time = null;
            mesage_info.delivery_type = MESSAGE.MESSAGE_DELIVERY_STATUS.READED;
            mesage_info.delete_message_users = delete_mesage_arr;
            mesage_info.message_caption = "";
            mesage_info.block_message_users = delete_mesage_arr;
            await mesage_info.save();

            let post_send: any = mesage_info.toObject();
            post_send.receiver_nm = originalName_reciver;
          
              
          const mySocketIds: any = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === block_by.toString() && item.cid.toString() === cid.toString()) {
                mySocketIds.push(item.socket_id);
              }
            })
          );

          let post = {
            isBlocked: 1,
            block_id: data.block_id,
            block_by: data.block_by,
          };
          if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("ack_send_block", post);

            io.to(mySocketIds).emit("ack_send_message", {
              message_detail:post_send,
              isgroup:0,
              sender_detail:sender_detail
            });
          }
        } else {
          if(block_by !== undefined && block_id !== undefined && cid !== undefined && block_by !== null && block_id !== null && cid !== null){
            await user_block.findOneAndDelete({
              block_by: data.block_by,
              block_id: data.block_id,
            });

            let get_user_detail: any = await user.findById({
              _id: block_by,
            });
            let sender_detail: any = {};
            let originalName_tmp: any = "";
            if (get_user_detail) {
              originalName_tmp =
                get_user_detail.first_name + " " + get_user_detail.last_name;
              sender_detail = {
                name:
                  get_user_detail.first_name + " " + get_user_detail.last_name,
                image: get_user_detail.user_image,
              };
            }

            let get_user_detail_reciver: any = await user.findById({
              _id: block_id,
            });
            let originalName_reciver: any = "";
            if (get_user_detail_reciver) {
              originalName_reciver =
                get_user_detail_reciver.first_name +
                " " +
                get_user_detail_reciver.last_name;
            }
            let message_tmp: any = "You Unblock " + originalName_reciver;

            let delete_mesage_arr: any[] = [block_id];
            let mesage_info = new conversation();
            mesage_info.cid = cid;
            mesage_info.sender_id = block_by;
            mesage_info.receiver_id = block_id;
            mesage_info.originalName = originalName_tmp ? originalName_tmp : "";
            mesage_info.message = await encrypt(message_tmp,cid);
            mesage_info.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
            mesage_info.media_type = MESSAGE.MESSAGE_MEDIA_TYPES.INFO;
            mesage_info.reply_message_id = "";
            mesage_info.schedule_time = null;
            mesage_info.delivery_type = MESSAGE.MESSAGE_DELIVERY_STATUS.READED;
            mesage_info.delete_message_users = delete_mesage_arr;
            mesage_info.message_caption = "";
            mesage_info.block_message_users = delete_mesage_arr;
            await mesage_info.save();

            let post_send: any = mesage_info.toObject();
            post_send.receiver_nm = originalName_reciver;
  

            const mySocketIds: any = [];
            await Promise.all(
              socket_users.map(async (item) => {
                if (item.uid.toString() === block_by.toString() && item.cid.toString() === cid.toString()) {
                  mySocketIds.push(item.socket_id);
                }
              })
            );
            let post = {
              isBlocked: 0,
              block_id: data.block_id,
              block_by: data.block_by,
            };
            if (mySocketIds.length > 0) {
              io.to(mySocketIds).emit("ack_send_block", post);

              io.to(mySocketIds).emit("ack_send_message", {
                message_detail:post_send,
                isgroup:0,
                sender_detail:sender_detail
              });
            }
          }
        }
      }
    });
    socket.on("delete_conversation", async function (data: any) {
      if (data) {
        let uid: any = data.uid
        let receiver_id: any = data.receiver_id
        let isgroup: any = data.isgroup
        let cid:any = data.cid

        if (isgroup) {
          await group_conversation.updateMany({
            group_id: receiver_id
          }, {
            $push: { delete_message_users: uid }
          }, {
            runValidators: true,
            new: true
          })
          await group.findOneAndUpdate({
            _id: receiver_id
          },
            {
              $pull: { group_users: uid }
            }, {
            runValidators: true
          })

          await group_members.findOneAndDelete({
            group_id: receiver_id,
            member_id: uid
          })
        } else {
          await conversation.updateMany({
            is_deleted: 0,
            $or: [
              { receiver_id: uid, sender_id: receiver_id },
              { receiver_id: receiver_id, sender_id: uid }
            ],
          },
            {
              $push: { delete_message_users: uid }
            },
            {
              runValidators: true,
              new: true
            });

          await user.findByIdAndUpdate({
            _id: receiver_id
          },
            {
              $push: { conversation_deleted_users: uid }
            },
            {
              runValidators: true,
              new: true
            })
        }

        const myACKSocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (item.uid.toString() === uid.toString() && item.cid.toString() === cid.toString()) {
              myACKSocketIds.push(item.socket_id);
            }
          })
        );
        if (myACKSocketIds.length > 0) {
          let post_detail: any = {
            uid: uid,
            receiver_id: receiver_id,
            isgroup: isgroup
          }
          io.to(myACKSocketIds).emit("ack_delete_conversation", {
            delete_conversation: post_detail
          });
        }

      }
    });
    socket.on("typing", async function (data: any) {
      if (data) {
        let sender_id: any = data.sender_id
        let reciver_id: any = data.reciver_id

        const mySocketIds: any[] = [];

        await Promise.all(
          socket_users.map(async (item) => {
            if (data.cid === item.cid && item.uid.toString() === reciver_id.toString()) {
              mySocketIds.push(item.socket_id);
            }
          })
        );
        if (mySocketIds.length > 0) {
          io.to(mySocketIds).emit("ack_typing", {
            sender_id: sender_id,
            reciver_id: reciver_id
          });
        }
      }
    });
    socket.on("send_create_group", async function (data: any) {
      let new_group_users = [...data.group_users, data.uid];
      new_group_users = new_group_users.filter((rows:any,index:any,arr:any)=> arr.indexOf(rows) === index)
      const temPost = new group();
      temPost.cid = data.cid;
      temPost.created_by = data.uid;
      temPost.group_name = data.group_name;
      temPost.description = data.description ? data.description : "";
      temPost.group_image = data.group_image ? data.group_image : "";
      temPost.group_users = new_group_users;
      await temPost.save();


      let get_user_nm: any = await user.findOne({
        _id: data.uid
      })

      let new_message: string = get_user_nm.first_name + " " + get_user_nm.last_name + " Created a Group";

      var post_convarsation: any = new group_conversation();
      post_convarsation.cid = data.cid;
      post_convarsation.group_id = temPost._id;
      post_convarsation.sender_id = data.uid;
      post_convarsation.originalName = "";
      post_convarsation.message = await encrypt(new_message,data.cid);
      post_convarsation.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
      post_convarsation.media_type = MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_CREATE;
      post_convarsation.reply_message_id = "";
      post_convarsation.schedule_time = data.schedule_time ? data.schedule_time : null;
      post_convarsation.block_message_users = [];
      await post_convarsation.save();



      var groupMembers = [
        {
          cid: data.cid,
          group_id: temPost._id,
          member_id: data.uid,
          is_admin: 1,
        },
      ];
      await Promise.all(
        new_group_users.map(async (items: any) => {
          if(items.toString() !== data.uid.toString())
          {
            var obj = {
              cid: data.cid,
              group_id: temPost._id,
              member_id: items,
              is_admin: 0,
            };
            groupMembers.push(obj);
          }
        })
      );

      await group_members.insertMany(groupMembers);
      let get_group_user_tmp:any  = await group_members.find({
        group_id:temPost._id
      }).populate({
        path:"member_id",
        model:"user",
        select:"first_name last_name user_image"
      })
      let post: any;
      post = temPost.toObject();
      post.group_image = post.group_image;
      post.group_users = get_group_user_tmp

      const myACKSocketIds: any[] = [];
      const mySocketIds: any[] = [];

      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid === data.uid) {
            myACKSocketIds.push(item.socket_id);
          }
          if (new_group_users.includes(item.uid) && item.uid !== data.uid) {
            mySocketIds.push(item.socket_id);
          }
        })
      );

      if (myACKSocketIds.length > 0) {
        io.to(myACKSocketIds).emit("ack_send_create_group", {
          post: post,
          infoMessage: post_convarsation
        });
      }
      if (mySocketIds.length > 0) {
        io.to(mySocketIds).emit("receive_create_group",
          {
            post: post,
            infoMessage: post_convarsation
          });
      }
    });
    socket.on("add_group_members", async function (data: any) {
      let cid: any = data.cid;
      let group_id: any = data.group_id;
      let member_ids: any[] = data.member_ids;
      let uid: any = data.uid
      let group_add_message: any[] = [];
      

      if(group_id !== undefined && member_ids.length > 0 && uid !== undefined){
        let get_group_detail: any = await group.findOne({
          _id: group_id
        })
        let get_user_nm: any = await user.findById({
          _id: uid
        })

        let get_group_users_arr:any []=[];
        let add_members_array:any[] = [];
        if(get_group_detail){
          get_group_users_arr = get_group_detail.group_users
          get_group_users_arr = get_group_users_arr.concat(member_ids)
          get_group_users_arr = get_group_users_arr.filter((rows:any,index:any,arr:any)=> arr.indexOf(rows) === index)

          
          await Promise.all(get_group_users_arr.map(async (items: any) => {
            let update_isleaved_users:any = await group_members.findOneAndUpdate({
              member_id:items,
              group_id:group_id,
              isleaved:1
            },{
              isleaved:0,
              add_member_time:new Date(),
              leave_member_time:null
            },{
              new:true,
              runValidators:true
            })
          }))          

          
          
          let created_group_id:any = new mongoose.Types.ObjectId(group_id)
          let check_already_add_users:any []= await group_members.aggregate([
            {
                $match: {
                    group_id: created_group_id
                }
            },
            {
                $group: {
                    _id: null,
                    member_ids: { $addToSet: "$member_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    member_ids: 1
                }
            }
        ]).exec();

        
        check_already_add_users = check_already_add_users.length > 0 ? check_already_add_users[0].member_ids : [];
        check_already_add_users = check_already_add_users.map(id=>id.toString())


          
          get_group_users_arr = get_group_users_arr.concat(check_already_add_users)
          get_group_users_arr = get_group_users_arr.concat(member_ids)
          get_group_users_arr = get_group_users_arr.filter((rows:any,index:any,arr:any)=> arr.indexOf(rows) === index)
          
          add_members_array = member_ids.filter(item=>!check_already_add_users.includes(item))
        }
        let message: any = get_user_nm?.first_name + " " + get_user_nm?.last_name + " added "
        if (get_group_detail) {
          await group.findByIdAndUpdate({
            _id: group_id
          }, {
            group_users:get_group_users_arr
          })

          let add_member_details:any[] = [];
          let group_message:any[] = [];
          
          if(add_members_array.length > 0){
            await Promise.all(add_members_array.map(async (items: any) => {
               let create_member_obj:any = {
                 cid:cid,
                 member_id:items,
                 is_admin:0,
                 group_id:group_id,
                 add_member_time:new Date()
               }
               add_member_details.push(create_member_obj)
             }))
           }

          await Promise.all(member_ids.map(async (items: any) => {
            let get_reciver_nm: any = await user.findById({
              _id: items
            })
  
            let tmp_msg = message + get_reciver_nm?.first_name + " " + get_reciver_nm?.last_name

            let create_group_message:any = {
              cid:cid,
              group_id:group_id,
              sender_id:uid,
              originalName:get_group_detail.group_name,
              message:await encrypt(tmp_msg,cid),
              message_type:MESSAGE.MESSAGE_TYPES.REGULAR,
              media_type:MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_MEMBER_ADD,
              reply_message_id:"",
              schedule_time:null,
              add_member_id:items
            }
            group_message.push(create_group_message)
          }))

          group_add_message = await group_conversation.insertMany(group_message); 
          let added_member_detail:any = await group_members.insertMany(add_member_details);

          let group_detail_tmp: any = await group.findOne({
            _id: group_id
          })
  
  
          const mySocketIds: any[] = [];
          const memberRoleSocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (group_detail_tmp.group_users.includes(item.uid.toString()) && !member_ids.includes(item.uid.toString())) {
                mySocketIds.push(item.socket_id);
              }
              if (member_ids.includes(item.uid.toString())) {
                memberRoleSocketIds.push(item.socket_id);
              }
            })
          );
  
          group_detail_tmp = await group.findOne({
            _id: group_id
          })
  
          let get_group_users: any = await group_members.find({
            group_id: group_id
          }).populate({
            path: "member_id",
            model: "user",
            select: "first_name last_name user_extension user_image"
          }).select("member_id is_admin");
  
          group_detail_tmp = group_detail_tmp.toObject();
  
          group_detail_tmp.group_users = get_group_users
  
          if (memberRoleSocketIds.length > 0) {
            io.to(memberRoleSocketIds).emit("receive_group_member_detail", {
              group_details: group_detail_tmp,
              groupPost: group_add_message,
              ismemebr_added: 1
            });
          }
  
          if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("ack_add_group_members", {
              group_details: group_detail_tmp,
              groupPost: group_add_message
            });
          }
        }
      }
    });
    socket.on("remove_group_members", async function (data: any) {
      let cid: any = data.cid;
      let group_id: any = data.group_id;
      let member_id: any = data.member_id;
      let uid: any = data.uid
      let group_remove_message: any[] = [];

      let get_group_detail: any = await group.findOne({
        _id: group_id
      })
      let get_user_nm: any = await user.findById({
        _id: uid
      })
      let message: any = get_user_nm?.first_name + " " + get_user_nm?.last_name + " Removed "
      if (get_group_detail && member_id) {

        await group.findByIdAndUpdate({
          _id: group_id
        }, {
          $pull: {
            group_users: member_id
          },
          $push:{
            group_leave_members:member_id
          }
        })


        let get_reciver_nm: any = await user.findById({
          _id: member_id
        })

        let tmp_msg = message + get_reciver_nm?.first_name + " " + get_reciver_nm?.last_name

        var groupPost: any = new group_conversation();
        groupPost.cid = cid;
        groupPost.group_id = group_id;
        groupPost.sender_id = uid;
        groupPost.originalName = get_group_detail.group_name;
        groupPost.message = await encrypt(tmp_msg,cid) || "";
        groupPost.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
        groupPost.media_type = MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_MEMBER_REMOVE;
        groupPost.reply_message_id = "";
        groupPost.schedule_time = null;
        groupPost.block_message_users = [];
        groupPost.remove_member_id = member_id
        await groupPost.save();
        group_remove_message.push(groupPost)

        await group_members.findOneAndUpdate({
          group_id: group_id,
          member_id: member_id
        },{
          is_admin:0,
          isleaved:1,
          leave_member_time:new Date(),
          add_member_time:null
        })

        let group_detail_tmp: any = await group.findOne({
          _id: group_id
        })


        const mySocketIds: any[] = [];
        const memberRoleSocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (group_detail_tmp.group_users.includes(item.uid.toString()) && member_id.toString() != item.uid.toString()) {
              mySocketIds.push(item.socket_id);
            }
            if (member_id.toString() === item.uid.toString()) {
              memberRoleSocketIds.push(item.socket_id);
            }
          })
        );

        group_detail_tmp = await group.findOne({
          _id: group_id
        })

        let get_group_users: any = await group_members.find({
          group_id: group_id
        }).populate({
          path: "member_id",
          model: "user",
          select: "first_name last_name user_extension user_image"
        }).select("member_id is_admin");

        group_detail_tmp = group_detail_tmp.toObject();

        group_detail_tmp.group_users = get_group_users

        if (memberRoleSocketIds.length > 0) {
          io.to(memberRoleSocketIds).emit("receive_group_member_detail", {
            group_details: group_detail_tmp,
            groupPost: group_remove_message,
            ismemebr_added: 0
          });
        }

        if (mySocketIds.length > 0) {
          io.to(mySocketIds).emit("ack_remove_group_members", {
            group_details: group_detail_tmp,
            groupPost: group_remove_message
          });
        }
      }
    });
    socket.on("send_group_admin", async function (data: any) {
      if (data) {
        let group_id: any = data.group_id;
        let member_id: any = data.member_id;
        let status: any = data.status;
        let uid: any = data.uid

        if(group_id !== undefined && member_id !== undefined && status !== undefined && uid !== undefined && group_id !== null && member_id !== null && status !== null && uid !== null){
          let tmp_group_member: any = await group.findById({
            _id: group_id,
          });
  
          let groupUsersData: any[] = tmp_group_member.group_users;
  
          const post = await group_members.findOneAndUpdate(
            {
              member_id: member_id,
              group_id: group_id,
            },
            {
              is_admin: status ? 1 : 0,
            },
            {
              new: true,
              runValidators: true,
            }
          );
  
          let get_addedmember_deatil: any = await user.findOne({
            _id: member_id
          })
  
          let get_user_nm: any = await user.findOne({
            _id: uid
          })
  
          let new_message: string;
          let media_type_tmp:any;
          if (status) {
            new_message = get_user_nm.first_name + " " + get_user_nm.last_name + " made" + " " + get_addedmember_deatil.first_name + " " + get_addedmember_deatil.last_name +" Admin";
            media_type_tmp =  MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_MAKE_ADMIN
          } else {
            new_message = get_user_nm.first_name + " " + get_user_nm.last_name + " removed" + " " + get_addedmember_deatil.first_name + " " + get_addedmember_deatil.last_name + " from Admin"; 
            media_type_tmp =  MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_REMOVE_FROM_ADMIN
          }
  
          var post_convarsation: any = new group_conversation();
          post_convarsation.cid = tmp_group_member.cid;
          post_convarsation.group_id = group_id;
          post_convarsation.sender_id = uid;
          post_convarsation.originalName = "";
          post_convarsation.message =await encrypt(new_message,tmp_group_member.cid);
          post_convarsation.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
          post_convarsation.media_type = media_type_tmp;
          post_convarsation.reply_message_id = "";
          post_convarsation.schedule_time = data.schedule_time ? data.schedule_time : null;
          post_convarsation.block_message_users = [];
          if (status) {
            post_convarsation.make_admin_id = member_id
          } else {
            post_convarsation.make_member_id = member_id
          }
          await post_convarsation.save();
  
          const mySocketIds: any[] = [];
          const memberRoleSocketIds: any[] = [];
  
          await Promise.all(
            socket_users.map(async (item) => {
              if (member_id !== item.uid.toString() && groupUsersData.includes(item.uid.toString())) {
                mySocketIds.push(item.socket_id);
              }
              if (member_id === item.uid.toString()) {
                memberRoleSocketIds.push(item.socket_id);
              }
            })
          );
  
          if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("receive_group_admin", {
              role: status ? 2 : 1,
              post,
              group_users: groupUsersData,
              group_id: group_id,
              infoMessage: post_convarsation
            });
          }
          if (memberRoleSocketIds.length > 0) {
            io.to(memberRoleSocketIds).emit("receive_group_member_role", {
              role: status ? 2 : 1,
              group_id,
              infoMessage: post_convarsation
            });
          }
        }
      }
    });
    socket.on("forward_message", async function (data: any) {
      let sender_id: any = data.sender_id
      let reciver_ids: any[] = data.reciver_ids
      let cid: any = data.cid
      let forward_message_ids: any[] = data.forward_message_ids

      let get_messages_detail: any = await conversation.find({
        _id: { $in: forward_message_ids }
      })
      let get_group_messages: any = await group_conversation.find({
        _id: { $in: forward_message_ids }
      })
      let message_details_arr: any[] = get_messages_detail.concat(get_group_messages)
      let inserted_messages: any[] = []
      await Promise.all(reciver_ids.map(async (item: any) => {
        if (item.isgroup == 0) {
          let insert_message_arr: any[] = [];
          await Promise.all(message_details_arr.map(async (row: any) => {
            let get_check_block_by_reciver:any = await user_block.findOne({
              block_by:item.receiver_id,
              block_id:sender_id
            })
            let delete_mesage_arr:any [] = [];
            if(get_check_block_by_reciver){
              delete_mesage_arr.push(item.receiver_id)
            }
            if (row.receiver_id !== null || row.receiver_id !== undefined) {
              var obj = {
                cid: row.cid,
                sender_id: sender_id,
                receiver_id: item.receiver_id,
                message: row.message,
                originalName: row.originalName ? row.originalName : "",
                message_type: MESSAGE.MESSAGE_TYPES.FORWARD,
                media_type: parseInt(row.media_type)
                  ? parseInt(row.media_type)
                  : MESSAGE.MESSAGE_MEDIA_TYPES.TEXT,
                reply_message_id: row.reply_message_id
                  ? row.reply_message_id
                  : "",
                schedule_time: row.schedule_time,
                delivery_type: MESSAGE.MESSAGE_DELIVERY_STATUS.SENDED,
                block_message_users: [],
                delete_message_users:delete_mesage_arr
              };
              insert_message_arr.push(obj);
            }
          }))
          let post: any = await conversation.insertMany(insert_message_arr);
          inserted_messages = inserted_messages.concat(post)
        } else {
          let insert_message_arr: any[] = [];
          await Promise.all(message_details_arr.map(async (row: any) => {
            if (row.group_id !== null || row.group_id !== undefined) {
              var obj = {
                cid: row.cid,
                sender_id: sender_id,
                group_id: item.receiver_id,
                originalName: row.originalName ? row.originalName : "",
                message: row.message || "",
                message_type: MESSAGE.MESSAGE_TYPES.FORWARD,
                media_type: parseInt(row.media_type)
                  ? parseInt(row.media_type)
                  : MESSAGE.MESSAGE_MEDIA_TYPES.TEXT,
                reply_message_id: row.reply_message_id
                  ? row.reply_message_id
                  : "",
                schedule_time: row.schedule_time,
                delivery_type: MESSAGE.MESSAGE_DELIVERY_STATUS.SENDED,
              };
              insert_message_arr.push(obj);
            }
          }))
          let post: any = await group_conversation.insertMany(insert_message_arr);
          inserted_messages = inserted_messages.concat(post)
        }
      }))
      let one_to_oneMessages: any[] = inserted_messages.filter((item) => item.receiver_id)
      let GroupMessages: any[] = inserted_messages.filter((item) => item.group_id)
      const myACKSocketIds: any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === sender_id.toString() && item.cid.toString() === cid.toString()) {
            myACKSocketIds.push(item.socket_id);
          }
        })
      );

      if (myACKSocketIds.length > 0) {
        await Promise.all(
          one_to_oneMessages.map(async (item: any) => {
            let post: any = item.toObject();
            post.tmp_message_id = null

            let get_user_detail:any = await user.findById({
              _id:post.sender_id
            })

            let sender_detail:any = {
              name:get_user_detail.first_name +" "+get_user_detail.last_name,
              image:get_user_detail.user_image
            }
            io.to(myACKSocketIds).emit("ack_send_message", {
              message_detail:post,
              isgroup:0,
              sender_detail:sender_detail
            });
          }))

        await Promise.all(
          GroupMessages.map(async (item: any) => {
            let post: any = item.toObject();
            post.tmp_message_id = null

            let get_sender_detail:any = await user.findById({
              _id:sender_id,
              is_deleted:0
            }).select("first_name last_name")

            if(get_sender_detail){
              post.sender_id = get_sender_detail
            }

            let get_group_detail:any = await group.findById({
              _id:post.group_id
            })

            let sender_detail:any = {
              name:get_group_detail.group_name,
              image:get_group_detail.group_image
            }

            io.to(myACKSocketIds).emit("ack_send_message", {
              message_detail:post,
              isgroup:1,
              sender_detail:sender_detail
            });
          }))
      }

      await Promise.all(
        one_to_oneMessages.map(async (item: any) => {
          let get_user_detail: any = await user.findOne({
            _id: data.sender_id
          })
          socket_users.map(async (row: any) => {
            if (!item.delete_message_users.includes(row.uid.toString()) && row.uid.toString() === item.receiver_id.toString() && row.uid.toString() != sender_id && row.cid.toString() === cid.toString()) {
              let post: any = item.toObject();
          
              let sender_detail:any = {
                name:get_user_detail.first_name +" "+get_user_detail.last_name,
                image:get_user_detail.user_image,
                endpointNumber:get_user_detail.get_user_detail,
              }

              post.sender_endpointnumber = get_user_detail !== null ?  get_user_detail.get_user_detail : "";

                io.to(row.socket_id).emit("receive_message", {
                  message_detail:post,
                  isgroup:0,
                  sender_detail:sender_detail
                });
              
            }
          })
          let get_token_users: any[] = [];
        let title_name: string = "";
        let notification_type:any = 0
        let notification_id:any = "";
       
        if(sender_id !== undefined){
          notification_id = sender_id
          notification_type = MESSAGE.PUSH_NOTIFICATION_TYPE.ONETOONE.toString()
          let get_user_detail:any = await user.findById({
            _id:sender_id
          })
          if(get_user_detail){
            title_name = get_user_detail.first_name + " " + get_user_detail.last_name
          }
        
            let user_mute_notificaion_detail = await notification_setting_users.findOne({
              notification_mute_id: sender_id,
              uid: item.receiver_id,
              notification_mute_type: { $ne: 4 },
              isgroup: 0
            })
            if (user_mute_notificaion_detail == null) {
              get_token_users.push(item.receiver_id)
            }
          
        }
        let getpushtokens = await user_tokens.find({
          uid: { $in: get_token_users },
          push_token: { $ne: "" }
        })
        let tmp_tokens: any[] = [];
        if (getpushtokens.length > 0) {
          await Promise.all(getpushtokens.map(async (items: any) => {
            tmp_tokens.push(items.push_token)
          }))
        }
  
        
        let title: any = title_name;
        let body: any = item.message.toString();
        let token: any[] = tmp_tokens
  
          if (data.media_type == 1) {
            body = "Image"
          } else if (data.media_type == 2) {
            body = "Video"
          } else if (data.media_type == 3) {
            body = "Audio"
          } else if (data.media_type == 4) {
            body = "Documentes"
          } else if (data.media_type == 5) {
            body = "Contact"
          } else if (data.media_type == 6) {
            body = "Location"
          } else {
            const decrypted_message = await decrypt(item.message,cid);
            body = decrypted_message.toString();
          }
          if (token.length > 0) {
            let notification_data: any = {
              type:notification_type,
              id: notification_id,
              roomid: "",
              message:JSON.stringify(post)
            }
            sendPushNotification(title, body, token, notification_data);
        }
        }))

      await Promise.all(
        GroupMessages.map(async (item: any) => {
          let get_group_dteail: any = await group.findById({
            _id: item.group_id
          })
          socket_users.map(async (row: any) => {
            if (get_group_dteail.group_users.includes(row.uid.toString()) && row.uid.toString() != sender_id && row.cid.toString() === cid.toString()) {
              let post: any = item.toObject();
              let get_sender_detail:any = await user.findById({
                _id:sender_id,
                is_deleted:0
              }).select("first_name last_name")

              if(get_sender_detail){
                post.sender_id = get_sender_detail
              }
              let sender_detail:any = {
                name:get_group_dteail.group_name,
                image:get_group_dteail.group_image
              }
              io.to(row.socket_id).emit("receive_message", {
                message_detail:post,
                isgroup:1,
                sender_detail:sender_detail
              });
            }
          })
          let get_token_users: any[] = [];
          let title_name: string = "";
          let notification_type:any = 0
          let notification_id:any = "";
        
          if(item.group_id !== undefined){
            notification_type = MESSAGE.PUSH_NOTIFICATION_TYPE.GROUP.toString()
            notification_id = item.group_id.toString()
            let reciver_ids_arr:any[] = [];
            let get_group_detail:any = await group.findById({
              _id:item.group_id
            })
            if(get_group_detail){
              title_name = get_group_detail.group_name
              reciver_ids_arr = get_group_detail?.group_users
            }
          
            await Promise.all(reciver_ids_arr.map(async (row: any) => {
              let user_mute_notificaion_detail = await notification_setting_users.findOne({
                notification_mute_id: item.group_id,
                uid: row,
                notification_mute_type: { $ne: 4 },
                isgroup: 1
              })
              if (user_mute_notificaion_detail == null && row.toString() != sender_id.toString()) {
                get_token_users.push(row)
              }
            }))
          }
          let getpushtokens = await user_tokens.find({
            uid: { $in: get_token_users },
            push_token: { $ne: "" }
          })
          let tmp_tokens: any[] = [];
          if (getpushtokens.length > 0) {
            await Promise.all(getpushtokens.map(async (items: any) => {
              tmp_tokens.push(items.push_token)
            }))
          }
    
          
          let title: any = title_name;
          let body: any = item.message.toString();
          let token: any[] = tmp_tokens
    
            if (data.media_type == 1) {
              body = "Image"
            } else if (data.media_type == 2) {
              body = "Video"
            } else if (data.media_type == 3) {
              body = "Audio"
            } else if (data.media_type == 4) {
              body = "Documentes"
            } else if (data.media_type == 5) {
              body = "Contact"
            } else if (data.media_type == 6) {
              body = "Location"
            } else {
              const decrypted_message = await decrypt(item.message,cid);
              body = decrypted_message.toString();
            }
    
            if (token.length > 0) {
              let notification_data: any = {
                type:notification_type,
                id: notification_id,
                roomid: ""
              }
              sendPushNotification(title, body, token, notification_data);
          }
        }))

    });
    socket.on("leave_goup", async function (data: any) {
      let uid: any = data.uid
      let group_id: any= data.group_id
      let cid: any = data.cid
      let group_detail:any = null;
      let post:any = null;
      let group_members_list:any [] = [];

      if(uid !== undefined && group_id !== undefined && cid !== undefined){
        group_detail = await group.findByIdAndUpdate({
          _id:group_id
        },{
          $push:{
            group_leave_members:uid
          },
          $pull: {
            group_users:uid
          }
        },{
          new:true,
          runValidators:true
        }) 

        let get_user_nm: any = await user.findById({
          _id: uid
        })
        let message: any = get_user_nm?.first_name + " " + get_user_nm?.last_name + " Left Group"

        post = new group_conversation();
        post.cid = cid;
        post.group_id = group_id;
        post.sender_id = uid;
        post.originalName = group_detail.group_name;
        post.message =await encrypt(message,cid) || "";
        post.message_type = data.message_type
          ? data.message_type
          : MESSAGE.MESSAGE_TYPES.REGULAR;
        post.media_type = data.media_type
          ? data.media_type
          : MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_LEAVE;
        post.reply_message_id = data.reply_message_id
          ? data.reply_message_id
          : "";
        post.schedule_time = data.schedule_time ? data.schedule_time : null;
        await post.save();

        await group_members.findOneAndUpdate({
          group_id:group_id,
          member_id:uid
        },{
          isleaved:1,
          is_admin:0,
          leave_member_time:new Date(),
          add_member_time:null
        })

         if(group_detail){
          let get_tmp_user:any[] = group_detail?.group_users
          group_members_list = get_tmp_user
         }
      }
      const sendrSocketIds: any[] = [];
        const ReciverSocketIds:any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === uid.toString() && item.cid.toString() === cid.toString()) {
            sendrSocketIds.push(item.socket_id);
          }
          if(item.uid.toString() !== uid.toString() && group_members_list.includes(item.uid) && item.cid.toString() === cid.toString()){
            ReciverSocketIds.push(item.socket_id)
          }
        })
      );

      if(sendrSocketIds.length > 0){
        io.to(sendrSocketIds).emit("ack_leave_goup", {
          message_detail:post,
          group_detail:group_detail,
          uid:uid
        });
      }
      if(ReciverSocketIds.length > 0){
        io.to(ReciverSocketIds).emit("receive_leave_goup", {
          message_detail:post,
          group_detail:group_detail,
          uid:uid
        });
      }
    });
    socket.on("send_update_user", async function (data: any) {
      if (data) {
        let uid:any = data.uid
        let user_image:any = data.user_image
        let first_name:any = data.first_name
        let last_name:any = data.last_name
        let cid:any = data.cid
        let post :any = null;
        if(uid !== undefined && user_image !== undefined && first_name !== undefined && last_name !== undefined){
          post = await user.findByIdAndUpdate(
            {
              _id: data.uid,
            },
            {
              user_image: data.user_image,
              first_name: data.first_name,
              last_name: data.last_name
            },
            {
              new: true,
              runValidators: true,
            }
          ).select("user_image first_name last_name")
        }


        const myACKSocketIds: any[] = [];
        const mySocketIds: any[] = [];

        await Promise.all(
          socket_users.map(async (item) => {
            if (cid.toString() === item.cid.toString() && item.uid.toString() === uid.toString()) {
              myACKSocketIds.push(item.socket_id);
            }
            if (cid.toString() === item.cid.toString() && item.uid.toString() !== uid.toString()) {
              mySocketIds.push(item.socket_id);
            }
          })
        );
        if (myACKSocketIds.length > 0) {
          io.to(myACKSocketIds).emit("ack_send_update_user", post);
        }
        if (mySocketIds.length > 0) {
          io.to(mySocketIds).emit("receive_update_user", post);
        }
      }
    });
    socket.on("mute_notification", async function (data: any) {
      if (data) {
        let notification_mute_id = data.notification_mute_id
        let cid = data.cid
        let uid = data.uid
        let isgroup = data.isgroup
        let notification_mute_type = data.notification_mute_type
        let mute_member_name:any = null;

        let unmute_date: any = ""
        if (notification_mute_type !== undefined &&  notification_mute_type == 1) {
          let get_current_date = moment().utc().format("YYYY-MM-DDTHH:mm:ss.sssZ")
          let get_current_date_seconds = moment(get_current_date).utc().set({ second: 0, millisecond: 0 });
          unmute_date = moment(get_current_date_seconds).utc().add(8, 'hours').format("YYYY-MM-DDTHH:mm:ss.sssZ")
        } else if (notification_mute_type !== undefined && notification_mute_type == 2) {
          let get_current_date = moment().utc().format("YYYY-MM-DDTHH:mm:ss.sssZ")
          let get_current_date_seconds = moment(get_current_date).utc().set({ second: 0, millisecond: 0 });
          unmute_date = moment(get_current_date_seconds).utc().add(7, 'days').format("YYYY-MM-DDTHH:mm:ss.sssZ")
        } else {
          unmute_date = null
        }


        let user_notification: any;
        if (notification_mute_id !== undefined && cid !== undefined && uid !== undefined && isgroup !== undefined) {
          let get_user_data = await notification_setting_users.findOne({
            cid: cid,
            uid: uid,
            isgroup: isgroup,
            notification_mute_id: notification_mute_id
          })
          if (get_user_data !== null) {
            user_notification = await notification_setting_users.findOneAndUpdate(
              {
                cid: cid,
                uid: uid,
                isgroup: isgroup,
                notification_mute_id: notification_mute_id
              },
              {
                notification_mute_type: notification_mute_type,
                notification_mute_date: unmute_date
              },
              {
                new: true,
                runValidators: true
              }
            );
            let get_mute_member_detail:any = await user.findById({
              _id:notification_mute_id
            })
            if(get_mute_member_detail){
              mute_member_name = get_mute_member_detail?.first_name + " " + get_mute_member_detail?.last_name
            }
          } else {
            user_notification = new notification_setting_users();
            user_notification.cid = cid,
              user_notification.uid = uid,
              user_notification.isgroup = isgroup,
              user_notification.notification_mute_id = notification_mute_id
            user_notification.notification_mute_type = notification_mute_type
            user_notification.notification_mute_date = unmute_date
            await user_notification.save();
            let get_mute_member_detail:any = await user.findById({
              _id:notification_mute_id
            })
            if(get_mute_member_detail){
              mute_member_name = get_mute_member_detail?.first_name + " " + get_mute_member_detail?.last_name
            }
          }
        }

        const myACKSocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (cid.toString() === item.cid.toString() && item.uid.toString() === uid.toString()) {
              myACKSocketIds.push(item.socket_id);
            }
          })
        );
        if (myACKSocketIds.length > 0) {
          io.to(myACKSocketIds).emit("ack_mute_conversation", {
            mute_conversation: user_notification,
            mute_member_name:mute_member_name
          });
        }
      }
    });
    socket.on("mute_notifiction_detail", async function (data: any) {
      if (data) {
        let uid: any = data.uid
        let recevier_id: any = data.recevier_id
        let cid: any = data.cid
        let isgroup: any = data.isgroup

        let mute_type_detail: any = 4
        let muted: any = 0
        let check_mute_type: any = await notification_setting_users.findOne({
          uid: uid,
          isgroup: isgroup,
          notification_mute_id: recevier_id,
          notification_mute_type: { $ne: 4 }
        })
        if (check_mute_type) {
          muted = 1
          mute_type_detail = check_mute_type.notification_mute_type
        }
        let mute_detail_obj: any = {
          ismute: muted,
          mute_type: mute_type_detail,
          uid: uid,
          recevier_id: recevier_id,
          isgroup: isgroup
        }
        const myACKSocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (cid.toString() === item.cid.toString() && item.uid.toString() === uid.toString()) {
              myACKSocketIds.push(item.socket_id);
            }
          })
        );
        if (myACKSocketIds.length > 0) {
          io.to(myACKSocketIds).emit("ack_mute_notifiction_detail", {
            mute_detail: mute_detail_obj
          });
        }
      }
    });
    socket.on("send_edit_group", async function (data: any) {
      let group_id:any = data.group_id
      let group_name:any = data.group_name
      let description:any = data.description
      let group_image:any = data.group_image
      let cid:any = data.cid
      let is_admin_send_message:any = data.is_admin_send_message
      let post:any = null
      let group_users_arr:any [] = [];
      if(
          group_id !== undefined && group_id !== null &&
          group_name !== undefined && group_name !== null && 
          description !== undefined && description !== null && 
          group_image !== undefined && group_image !== null && 
          cid !== undefined && cid !== null && 
          is_admin_send_message !== undefined && is_admin_send_message !== null 
        ){
          const tempPost: any = await group.findByIdAndUpdate(
            {
              _id: group_id
            },
            {
              group_name: group_name,
              description:description,
              group_image: group_image,
              is_admin_send_message:is_admin_send_message
            },
            {
              new: true,
              runValidators: true,
            }
          );
          if(tempPost){
            let get_group_user_detail:any = await group_members.find({
              group_id:group_id
          }).populate({
              path:"member_id",
              model:"user",
              select:"first_name last_name user_image"
            })
            group_users_arr = tempPost.group_users
            post = tempPost.toObject();
            post.group_users = get_group_user_detail
          }
        }

      const mySocketIds: any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if (group_users_arr.includes(item.uid.toString()) && item.cid.toString() === cid.toString()) {
            mySocketIds.push(item.socket_id);
          }
        })
      );
      if (mySocketIds.length > 0) {
        io.to(mySocketIds).emit("receive_edit_group", post);
      }
    });
    socket.on("user_messages", async function (data: any, callback: any) {
      if (data && data.last_message_date !== null) {
        const newSenders: any[] = [];
        const Message_date: any = moment(data.last_message_date).utc().format("YYYY-MM-DDTHH:mm:ss.sssZ")
        const getSenderList = await conversation.find({
          is_deleted: 0,
          $or: [
            { receiver_id: data.uid },
            { sender_id: data.uid }
          ],
          block_message_users: { $ne: data.uid },
          updatedAt: { $gt: Message_date }
        });

        let get_group_msg: any[] = await group_message_status.find({
          $or: [
            { receiver_id: data.uid },
            { sender_id: data.uid }
          ],
          updatedAt: { $gt: Message_date }
        }).distinct("message_id")

        let get_group_mes_detail: any[] = await group_conversation.find({
          _id: { $in: get_group_msg }
        })


        const myACKSocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (item.uid.toString() === data.uid.toString() && item.cid.toString() === data.cid.toString()) {
              myACKSocketIds.push(item.socket_id);
            }
          })
        );

        if (myACKSocketIds.length > 0) {
          await Promise.all(
            getSenderList.map(async (item: any) => {
              let get_user_detail: any = await user.findOne({
                _id: item.sender_id
              })
              socket_users.map(async (row: any) => {
                if (!item.delete_message_users.includes(row.uid.toString()) && row.uid.toString() === item.receiver_id.toString() && row.uid.toString() != item.sender_id && row.cid.toString() === item.cid.toString()) {
                  let post: any = item.toObject();
              
                  let sender_detail:any = {
                    name:get_user_detail.first_name +" "+get_user_detail.last_name,
                    image:get_user_detail.user_image
                  }
    
                    io.to(row.socket_id).emit("receive_message", {
                      message_detail:post,
                      isgroup:0,
                      sender_detail:sender_detail
                    });
                  
                }
              })
            }))
    
          await Promise.all(
            get_group_mes_detail.map(async (item: any) => {
              let get_group_dteail: any = await group.findById({
                _id: item.group_id
              })
              socket_users.map(async (row: any) => {
                if (get_group_dteail.group_users.includes(row.uid.toString()) && row.uid.toString() != item.sender_id && row.cid.toString() === item.cid.toString()) {
                  let post: any = item.toObject();
                  let get_sender_detail:any = await user.findById({
                    _id:item.sender_id,
                    is_deleted:0
                  }).select("first_name last_name")
    
                  if(get_sender_detail){
                    post.sender_id = get_sender_detail
                  }
                  let sender_detail:any = {
                    name:get_group_dteail.group_name,
                    image:get_group_dteail.group_image
                  }
                  io.to(row.socket_id).emit("receive_message", {
                    message_detail:post,
                    isgroup:1,
                    sender_detail:sender_detail
                  });
                }
              })
            }))
        }
        // if (getSenderList.length > 0) {
        //   await Promise.all(
        //     getSenderList.map(async (tempConversation: any) => {
        //       let newConversation = {
        //       };
        //       let post: any = tempConversation
        //       io.to(MySocketid).emit("receive_message", {
        //         post,
        //         newConversation,
        //       });
        //     }))
        // }

        // if (get_group_mes_detail.length > 0) {
        //   await Promise.all(
        //     get_group_mes_detail.map(async (post_detail: any) => {
        //       let get_sender_nm = await user.findById({
        //         _id: post_detail.sender_id
        //       })
        //       post_detail = post_detail.toObject();
        //       post_detail.sender_name = get_sender_nm
        //         ? get_sender_nm.first_name + " " + get_sender_nm.last_name
        //         : "";
        //       io.to(MySocketid).emit("group_receive_message", post_detail);
        //     }))
        // }
        //io.to(MySocketid).emit("last_messages", Messages_detail);
      }
    });
    socket.on("user_online_status",async function (data:any,callback:any){
      let receiver_id:any = data.receiver_id
      let uid:any = data.uid
      let cid:any = data.cid

      
      if(receiver_id !== undefined && receiver_id !== null && mongoose.Types.ObjectId.isValid(receiver_id)){
        let get_user_detail:any = await user.findById({
          _id:receiver_id
        })
        if (get_user_detail) {
          let user_status: any = get_user_detail.is_online;
          let user_lastseen_time: any = get_user_detail.last_seen;

          let send_obj:any = {
            user_status:user_status,
            user_lastseen_time:user_lastseen_time,
            receiver_id:receiver_id,
            uid:uid,
            cid:cid
          }

          const sendrSocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (
                item.uid.toString() === uid.toString() &&
                item.cid.toString() === cid.toString()
              ) {
                sendrSocketIds.push(item.socket_id);
              }
            })
          );
          if (sendrSocketIds.length > 0) {
            io.to(sendrSocketIds).emit("ack_user_online_status", send_obj);
          }
        }
      }
    })
    socket.on("update_group_message_setting", async function (data: any) {
      let uid: any = data.uid
      let group_id: any= data.group_id
      let cid: any = data.cid
      let is_admin_send_message:any = data.is_admin_send_message;
      let group_detail:any = null;
      let post:any = null;
      let group_members:any [] = [];

      if(uid !== undefined && group_id !== undefined && cid !== undefined){
        group_detail = await group.findByIdAndUpdate({
          _id:group_id
        },{
          is_admin_send_message:is_admin_send_message
        },{
          new:true,
          runValidators:true
        }) 

        let get_user_nm: any = await user.findById({
          _id: uid
        })
        let message: any = get_user_nm?.first_name + " " + get_user_nm?.last_name + " Change Group Message Setting";

        post = new group_conversation();
        post.cid = cid;
        post.group_id = group_id;
        post.sender_id = uid;
        post.originalName =  "";
        post.message =await encrypt(message,cid) || "";
        post.message_type = MESSAGE.MESSAGE_TYPES.REGULAR;
        post.media_type = MESSAGE.MESSAGE_MEDIA_TYPES.GROUP_MESSAGE_SETING_UPDATE;
        post.reply_message_id = "";
        post.schedule_time = null;
        await post.save();

         if(group_detail){
          let get_tmp_user:any[] = group_detail?.group_users
          group_members = get_tmp_user
         }
      }
     
        const ReciverSocketIds:any[] = [];
      await Promise.all(
        socket_users.map(async (item) => {
          if(group_members.includes(item.uid) && item.cid.toString() === cid.toString()){
            ReciverSocketIds.push(item.socket_id)
          }
        })
      );

      if(ReciverSocketIds.length > 0){
        io.to(ReciverSocketIds).emit("ack_update_group_message_setting", {
          message_detail:post,
          group_detail:group_detail
        });
      }
    });
    socket.on("user_last_activity", async function (data: any) {
      try {
        let uid:any = data.uid
        let cid:any = data.uid
        let receiver_id:any = data.receiver_id

        if(uid !== undefined && cid !== undefined && receiver_id !== undefined){
          let get_user_detail:any = await user.findById({
            _id:receiver_id
          })
          if(get_user_detail){
            let post = {
              _id: get_user_detail._id,
              is_online: get_user_detail.is_online,
              last_seen: get_user_detail.last_seen
            };
  
          const mySocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (
                item.uid == data.uid && item.cid == data.cid
              ) {
                mySocketIds.push(item.socket_id);
              } 
            })
          );
          if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("send_online_status", post);
          }
  
          }  
        }
      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    });
    socket.on("initalize_call", async function (data: any) {
      try {
          let caller_nm:any = data.caller_nm
          let reciver_id: any[] = data.reciver_id
          let call_type: any[] = data.call_type
          let room_id = data.room_id
          let caller_id = data.caller_id
          let group_id = data.group_id

           const mySocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (
                  reciver_id.includes(item.uid.toString())
              ) {
                mySocketIds.push(item.socket_id);
              } 
            })
          );

         let group_name:any = ""
         let group_image:any = ""
         let group_detail:any = await group.findById(group_id)
         if(group_detail){
          group_name = group_detail.group_name
          group_image = group_detail.group_image
         } 

           if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("incoming_call",{
              caller_nm:caller_nm,
              reciver_id:reciver_id,
              call_type:call_type,
              room_id:room_id,
              group_id:group_id,
              group_name:group_name,
              group_image:group_image
            });
          }

          let get_token_users :any [] = [];
          await Promise.all(reciver_id.map(async (row: any) => {
            let user_mute_notificaion_detail = await notification_setting_users.findOne({
              notification_mute_id: caller_id,
              uid: row,
              notification_mute_type: { $ne: 4 },
              isgroup: 0
            })
            if (user_mute_notificaion_detail == null) {
              get_token_users.push(row)
            }
          }))
        
        let getpushtokens = await user_tokens.find({
          uid: { $in: get_token_users },
          push_token: { $ne: "" }
        })
        let tmp_tokens: any[] = [];
        if (getpushtokens.length > 0) {
          await Promise.all(getpushtokens.map(async (items: any) => {
            tmp_tokens.push(items.push_token)
          }))
        }
  
        let get_caller_detail:any = await user.findById({
          _id:caller_id
        })
        let caller_img:any = ""
        if(get_caller_detail){
          caller_img = get_caller_detail.user_image
        }
        
        let title: any = "Incoming Call";
        let body: any = caller_nm.toString();
        let token: any[] = tmp_tokens
  
        let uuid4: string =  uuidv4();
          if (token.length > 0) {
            let notification_data: any = {
              caller_nm:caller_nm.toString(),
              call_type: call_type.toString(),
              room_id: room_id.toString(),
              caller_image:caller_img.toString(),
              group_id:group_id.toString(),
              session_id:uuid4.toString(),
              caller_id:caller_nm.toString(),
              caller_name:caller_nm.toString(),
              call_opponents:caller_nm.toString(),
              user_info:caller_nm.toString(),
              group_name:group_name.toString(),
              group_image:group_image.toString()
            }
            sendPushNotification(title, body, token, notification_data);
          }
      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    });
    socket.on("end_call", async function (data: any) {
      try {
          let caller_nm:any = data.caller_nm
          let reciver_id: any[] = data.reciver_id
          let call_type: any[] = data.call_type
          let room_id = data.room_id

           const mySocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (
                  reciver_id.includes(item.uid.toString())
              ) {
                mySocketIds.push(item.socket_id);
              } 
            })
          );

           if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("ack_end_call",{
              caller_nm:caller_nm,
              reciver_id:reciver_id,
              call_type:call_type,
              room_id:room_id
            });
          }
          let get_token_users :any [] = [];
          await Promise.all(reciver_id.map(async (row: any) => {
            get_token_users.push(row)
          }))
        
        let getpushtokens = await user_tokens.find({
          uid: { $in: get_token_users },
          push_token: { $ne: "" }
        })
        let tmp_tokens: any[] = [];
        if (getpushtokens.length > 0) {
          await Promise.all(getpushtokens.map(async (items: any) => {
            tmp_tokens.push(items.push_token)
          }))
        }
        
        let title: any = "End Call";
        let body: any = caller_nm.toString();
        let token: any[] = tmp_tokens

          if (token.length > 0) {
            let notification_data: any = {
              room_id: room_id.toString()
            }
            sendPushNotification(title, body, token, notification_data);
          }
      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    });
    socket.on("group_details_info",async function (data: any){
      try {
        let group_id: any = data.group_id;
        let last_activity_time: any = data.last_activity_time;
        let uid: any = data.uid;
        let device_id: any = data.device_id;

        if (
          mongoose.Types.ObjectId.isValid(group_id) ||
          (mongoose.Types.ObjectId.isValid(uid) &&
            moment(last_activity_time, "YYYY-MM-DDTHH:mm:ss.sss").isValid())
        ) {
          let last_message_time: any = moment(
            last_activity_time,
            "YYYY-MM-DDTHH:mm:ss.sss"
          ).format("YYYY-MM-DDTHH:mm:ss.sssZ");
          let get_year: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("YYYY");
          let get_month: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("MM");
          let get_day: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("DD");
          let get_hour: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("HH");
          let get_minutes: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("mm");
          let get_seconds: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("ss");
          let get_miliseconds: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("sss");

          let get_int_month: any = parseFloat(get_month) - 1;

          let new_tmp_date: any = new Date();
          new_tmp_date.setUTCFullYear(get_year);
          new_tmp_date.setUTCMonth(get_int_month);
          new_tmp_date.setUTCDate(get_day);
          new_tmp_date.setUTCHours(get_hour);
          new_tmp_date.setUTCMinutes(get_minutes);
          new_tmp_date.setUTCSeconds(get_seconds);
          new_tmp_date.setUTCMilliseconds(get_miliseconds);
          last_message_time = new_tmp_date;

          let check_group_detail: any = await group.findById({
            _id: group_id,
          });

          if (check_group_detail) {
            let get_group_user_detail: any = await group_members
              .find({
                group_id: group_id
              })
              .populate({
                path: "member_id",
                model: "user",
                select: "first_name last_name user_image",
              });
            let post = check_group_detail.toObject();
            post.group_users = get_group_user_detail;

            let mySocketIds: any[] = [];
            await Promise.all(
              socket_users.map(async (item) => {
                if (
                  item.uid.toString() === data.uid.toString() &&
                  item.device_id.toString() === device_id.toString()
                ) {
                  mySocketIds.push(item.socket_id);
                }
              })
            );
            if (mySocketIds.length > 0) {
              io.to(mySocketIds).emit("receive_edit_group", post);
            }
          }
        }
      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    })
    socket.on("user_last_info",async function (data: any){
      try {
        let last_activity_time: any = data.last_activity_time;
        let uid: any = data.uid;
        let device_id: any = data.device_id;
        let get_user_connection:any []= socket_users.filter((item)=>item.device_id.toString() === device_id.toString() && item.uid.toString() === uid.toString())

        if (mongoose.Types.ObjectId.isValid(uid) && moment(last_activity_time, "YYYY-MM-DDTHH:mm:ss.sss").isValid()) 
        {
          let last_message_time: any = moment(
            last_activity_time,
            "YYYY-MM-DDTHH:mm:ss.sss"
          ).format("YYYY-MM-DDTHH:mm:ss.sssZ");
          let get_year: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("YYYY");
          let get_month: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("MM");
          let get_day: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("DD");
          let get_hour: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("HH");
          let get_minutes: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("mm");
          let get_seconds: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("ss");
          let get_miliseconds: any = moment(
            last_message_time,
            "YYYY-MM-DDTHH:mm:ss.sssZ"
          ).format("sss");

          let get_int_month: any = parseFloat(get_month) - 1;

          let new_tmp_date: any = new Date();
          new_tmp_date.setUTCFullYear(get_year);
          new_tmp_date.setUTCMonth(get_int_month);
          new_tmp_date.setUTCDate(get_day);
          new_tmp_date.setUTCHours(get_hour);
          new_tmp_date.setUTCMinutes(get_minutes);
          new_tmp_date.setUTCSeconds(get_seconds);
          new_tmp_date.setUTCMilliseconds(get_miliseconds);
          last_message_time = new_tmp_date;
          last_message_time = new Date(last_message_time)

        
            let get_one_to_one_msg:any = await conversation.find({
              delete_message_users: {$in:uid},
              createdAt: { $gte: last_message_time },
            })
            if (get_one_to_one_msg.length > 0) {
              await Promise.all(
                get_one_to_one_msg.map(async (item: any) => {
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() != item.sender_id.toString() &&
                      row.uid.toString() == item.receiver_id.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("receive_delete_message", {
                        Deleted_messages: [item],
                        isgroup: 0,
                        sender_id: item.sender_id,
                        receiver_id: item.receiver_id,
                        group_id: null,
                      });
                    }
                    if (
                      row.uid.toString() === item.sender_id.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_delete_message", {
                        Deleted_messages: [item],
                        isgroup: 0,
                        sender_id: item.sender_id,
                        receiver_id: item.receiver_id,
                        group_id: null,
                      });
                    }
                  });
                })
              );
            }

            let get_add_group_deleted_messages: any[] =
              await group_conversation.find({
                delete_message_users: {$in:uid},
                createdAt: { $gte: last_message_time },
              });
            if (get_add_group_deleted_messages.length > 0) {
              await Promise.all(
                get_add_group_deleted_messages.map(async (item: any) => {
                  let get_group_dteail: any = await group.findById({
                    _id: item.group_id
                  })
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() != item.sender_id &&
                      get_group_dteail.group_users.includes(row.uid.toString()) &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("receive_delete_message", {
                        Deleted_messages: [item],
                        isgroup: 1,
                        sender_id: item.sender_id,
                        receiver_id: null,
                        group_id: item.group_id,
                      });
                    }
                    if (
                      row.uid.toString() === item.sender_id.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_delete_message", {
                        Deleted_messages: [item],
                        isgroup: 1,
                        sender_id: item.sender_id,
                        receiver_id: null,
                        group_id: item.group_id,
                      });
                    }
                  });
                })
              );
            }
            
            let get_user_updated_detail:any []= await user.find({
              _id:uid,
              is_deleted:0,
              updatedAt: { $gte: last_message_time },
            }).select("user_image first_name last_name eid")

            if(get_user_updated_detail.length > 0){
              await Promise.all(
                get_user_updated_detail.map(async (item: any) => {
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() === item._id.toString() &&
                      row.cid.toString() === item.eid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_send_update_user", {
                        post:item
                      });
                    }
                  });
                })
              );
            }

            let get_created_group:any = await group.find({
              group_users:{$in:[uid]},
              is_deleted:0,
              createdAt: { $gte: last_message_time }
            })

            if(get_created_group.length > 0){
              await Promise.all(
                get_created_group.map(async (item: any) => {
                  let get_group_dteail: any = await group.findById({
                    _id: item._id
                  })
                  if(get_group_dteail){
                    let group_user_detail:any [] = await group_members.find({
                      group_id:item._id
                    }).populate({
                      path:"member_id",
                      model:"user",
                      select:"first_name last_name user_image"
                    })
                    let post_group:any = get_group_dteail.toObject();
                    post_group.group_users = group_user_detail

                    let get_first_message:any = await group_conversation.findOne({
                      group_id:item._id
                    }).sort({createdAt:1})


                    let post_convarsation:any = get_first_message
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() === item.created_by.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_send_create_group", {
                        post: post_group,
                        infoMessage: post_convarsation
                      });
                    }
                    if (
                      row.uid.toString() !== item.created_by.toString() &&
                      row.cid.toString() ===  item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("receive_create_group",
                      {
                        post: post_group,
                        infoMessage: post_convarsation
                      });
                  
                    }
                  });
                  }
                })
              );
            }

            let get_add_group_member_datils:any = await group_conversation.aggregate([
              {
                $match:{
                  is_deleted:0,
                  media_type:{$in:[9,10,11,12,13,14]},
                  createdAt: { $gte: last_message_time }
                }
              },
              {
                $sort:{
                  createdAt:-1
                }
              }
            ])

            if(get_add_group_member_datils.length > 0){
              await Promise.all(
                get_add_group_member_datils.map(async (item: any) => {
                  let get_group_dteail: any = await group.findById({
                    _id: item.group_id,
                  })
                  if(get_group_dteail !== null){
                  let group_user_detail:any [] = await group_members.find({
                    group_id:item.group_id
                  }).populate({
                    path:"member_id",
                    model:"user",
                    select:"first_name last_name user_image"
                  }).select("member_id is_admin isleaved");

                  let get_group_user_detail_tmp:any = await group_members.findOne({
                    group_id:item.group_id,
                    member_id:uid
                  })


                  let post_group:any = get_group_dteail.toObject();
                  post_group.group_users = group_user_detail
                   let post_convarsation:any = item
                  if(get_group_dteail && item.media_type == 9){
                    let check_user_detail:any [] = group_user_detail.filter(itemss=>itemss.member_id._id.toString() == uid.toString())
                    get_user_connection.map(async (row: any) => {
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.add_member_id.toString() !== uid.toString() &&
                        row.cid.toString() === item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        io.to(row.socket_id).emit("ack_add_group_members", {
                          group_details: post_group,
                          groupPost: [post_convarsation]
                        });
                      }
                      if (
                        check_user_detail.length > 0  &&
                        check_user_detail[0].isleaved == 0 &&
                        item.add_member_id.toString() == uid.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                          io.to(row.socket_id).emit("receive_group_member_detail", {
                            group_details: post_group,
                            groupPost: [post_convarsation],
                            ismemebr_added: 1
                          });
                    
                      }
                    });
                  }
                  if(get_group_dteail && item.media_type == 10){
                    let get_group_user_detail:any = await group_members.findOne({
                      group_id:item.group_id,
                      leave_member_time:{$gte:new Date(item.createdAt)}
                    }).sort({leave_member_time:-1})

                    let check_user_detail:any [] = group_user_detail.filter(itemss=>itemss.member_id._id.toString() == uid.toString())

                    get_user_connection.map(async (row: any) => {
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.remove_member_id.toString() !== uid.toString() &&
                        row.cid.toString() === item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        io.to(row.socket_id).emit("ack_remove_group_members", {
                          group_details: post_group,
                          groupPost: [post_convarsation]
                        });
                      }
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 1 &&
                        item.remove_member_id.toString() === uid.toString() &&
                        row.uid.toString() !== item.sender_id.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                          io.to(row.socket_id).emit("receive_group_member_detail", {
                            group_details: post_group,
                            groupPost: [post_convarsation],
                            ismemebr_added: 0
                          });
                    
                      }
                    });
                  }
                  if(get_group_dteail && item.media_type == 11){
                    let check_user_detail:any [] = group_user_detail.filter(itemss=>itemss.member_id._id.toString() == uid.toString())
                    get_user_connection.map(async (row: any) => {
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.make_admin_id.toString() !== uid.toString() &&
                        row.cid.toString() === item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        let post_member:any = await group_members.findOne({
                          group_id:item.group_id,
                          member_id:item.sender_id
                        })
                        io.to(row.socket_id).emit("receive_group_admin", {
                          role:2,
                          post:post_member,
                          group_users: get_group_dteail.group_users,
                          group_id: item.group_id,
                          infoMessage: post_convarsation
                        });
                      
                      }
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.make_admin_id.toString() == uid.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                          io.to(row.socket_id).emit("receive_group_member_role", {
                            role:2,
                            group_id:item.group_id,
                            infoMessage: post_convarsation
                          });
                      }
                        
                    });
                  }
                  if(get_group_dteail && item.media_type == 12){
                    let check_user_detail:any [] = group_user_detail.filter(itemss=>itemss.member_id._id.toString() == uid.toString())
                    get_user_connection.map(async (row: any) => {
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.make_member_id.toString() !== uid.toString() &&
                        row.cid.toString() === item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        let post_member:any = await group_members.findOne({
                          group_id:item.group_id,
                          member_id:item.sender_id
                        })
                        io.to(row.socket_id).emit("receive_group_admin", {
                          role:1,
                          post:post_member,
                          group_users: get_group_dteail.group_users,
                          group_id: item.group_id,
                          infoMessage: post_convarsation
                        });
                      
                      }
                      if (
                        check_user_detail.length > 0 &&
                        check_user_detail[0].isleaved == 0 &&
                        item.make_member_id.toString() == uid.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                          io.to(row.socket_id).emit("receive_group_member_role", {
                            role:1,
                            group_id:item.group_id,
                            infoMessage: post_convarsation
                          });
                      }
                    });
                  }
                  if(get_group_dteail && item.media_type == 13){
                    get_user_connection.map(async (row: any) => {
                      if (
                        row.uid.toString() === item.sender_id.toString() &&
                        row.cid.toString() === item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        io.to(row.socket_id).emit("ack_leave_goup", {
                          message_detail:post_convarsation,
                          group_detail:get_group_dteail,
                          uid:item.sender_id
                        });
                      }
                      if (
                        get_group_dteail.group_users.includes(row.uid.toString()) &&
                        row.uid.toString() !== item.sender_id.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                          io.to(row.socket_id).emit("receive_leave_goup", {
                            message_detail:post_convarsation,
                            group_detail:get_group_dteail,
                            uid:item.sender_id
                          });
                      } 
                    });
                  }
                  if(get_group_dteail && item.media_type == 14){
                    get_user_connection.map(async (row: any) => {
                      if (
                        get_group_dteail.group_users.includes(row.uid.toString()) &&
                        row.uid.toString() === uid.toString() &&
                        row.cid.toString() ===  item.cid.toString() &&
                        row.device_id.toString() === device_id.toString()
                      ) {
                        io.to(row.socket_id).emit("ack_update_group_message_setting", {
                          message_detail:post_convarsation,
                          group_detail:get_group_dteail
                        });
                      }
                    });
                  }
                }
                })
              );
            }


            let get_edit_groups:any = await group.find({
              is_deleted:0,
              group_users:{$in:[uid]},
              updatedAt: { $gte: last_message_time }
            })
            if(get_edit_groups.length > 0){
              await Promise.all(
                get_edit_groups.map(async (item: any) => {
                  let get_group_dteail: any = await group.findById({
                    _id: item._id
                  })

                  if(get_group_dteail){
                    let group_user_detail:any [] = await group_members.find({
                      group_id:item._id
                    }).populate({
                      path:"member_id",
                      model:"user",
                      select:"first_name last_name user_image"
                    })
                    let post_group:any = get_group_dteail.toObject();
                    post_group.group_users = group_user_detail

                  get_user_connection.map(async (row: any) => {
                    if (
                      get_group_dteail.group_users.includes(row.uid.toString()) &&
                      row.uid.toString() === uid.toString() &&
                      row.cid.toString() ===  item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                     
                        io.to(row.socket_id).emit("receive_edit_group", post_group);
                      
                    }
                  });
                  }
                })
              );
            }

            let get_one_to_one_msg_eidted:any = await conversation.find({
              is_edited:1,
              updatedAt: { $gte: last_message_time },
            })
            if (get_one_to_one_msg_eidted.length > 0) {
              await Promise.all(
                get_one_to_one_msg_eidted.map(async (item: any) => {
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() != item.sender_id &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("receive_edit_message", {
                        message_detail:item,
                        isgroup:0,
                        group_id:null
                      });
                    }
                    if (
                      row.uid.toString() === item.sender_id.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_send_edit_message", {
                        message_detail:item,
                        isgroup:0,
                        group_id:null
                      });
                    }
                  });
                })
              );
            }

            let get_add_group_edited_messages: any[] =
              await group_conversation.find({
                is_edited:1,
                updatedAt: { $gte: last_message_time },
              });
            if (get_add_group_edited_messages.length > 0) {
              await Promise.all(
                get_add_group_edited_messages.map(async (item: any) => {
                  get_user_connection.map(async (row: any) => {
                    if (
                      row.uid.toString() != item.sender_id &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("receive_edit_message", {
                        message_detail:item,
                        isgroup:1,
                        group_id:item.group_id
                      });
                    }
                    if (
                      row.uid.toString() === item.sender_id.toString() &&
                      row.cid.toString() === item.cid.toString() &&
                      row.device_id.toString() === device_id.toString()
                    ) {
                      io.to(row.socket_id).emit("ack_send_edit_message", {
                        message_detail:item,
                        isgroup:1,
                        group_id:item.group_id
                      });
                    }
                  });
                })
              );
            }
            
        }
      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    })
    socket.on("read_all_delivered_message",async function (data: any){
      try {
        let uid:any = data.uid
        let recevier_id:any = data.recevier_id
        let isgroup:any = data.isgroup
        let cid:any = data.cid
        let message_sender_id_arr:any = []
        let sender_msges_arr:any = []
        let sender_msges_id_arr:any = []

        
        if(isgroup && mongoose.Types.ObjectId.isValid(uid) && mongoose.Types.ObjectId.isValid(recevier_id)){

          let get_msgess_ids:any []= await group_message_status.find({
            receiver_id:uid,
            group_id:recevier_id,
            delivery_type:2
          }).distinct("message_id")

          let updated_group_receive_msg:any = await group_message_status.updateMany({
            receiver_id:uid,
            group_id:recevier_id,
            delivery_type:2
          },
          { 
            $set: { delivery_type: 3 }
          }
          )

        
          let update_group_message_ids:any = await group_conversation.aggregate([
            {
              $match:{
                _id:{$in:get_msgess_ids}
              }
            },
            {
              $lookup: {
                from: "group_message_statuses",
                localField: "_id",
                foreignField: "message_id",
                as: "group_messages_total_count"
              }
            },
             {
              $lookup: {
                from: "group_message_statuses",
                localField: "_id",
                foreignField: "message_id",
                pipeline: [
                  {
                    $match: {
                      delivery_type:2
                    }
                  },
                ],
                as: "group_messages_total_deliver_count"
              }
            },
            {
              $lookup: {
                from: "group_message_statuses",
                localField: "_id",
                foreignField: "message_id",
                pipeline: [
                  {
                    $match: {
                      delivery_type:3
                    }
                  },
                ],
                as: "group_messages_total_read_count"
              }
            },
            {
              $addFields:{
                delivery_type_tmp:{
                  $switch: {
                    branches: [
                        {
                            case: { $eq: [{ $size: "$group_messages_total_deliver_count" }, { $size: "$group_messages_total_count" }] },
                            then:2
                        },
                        {
                            case: { $eq: [{ $size: "$group_messages_total_read_count" }, { $size: "$group_messages_total_count" }] },
                            then:3
                        }
                    ],
                    default:1
                }
                }
              }
            },
            {
              $match: {
                  delivery_type_tmp:3
              }
          },
            {
              $project: {
                  _id: 1
              }
          }
         
          ])

          sender_msges_id_arr = update_group_message_ids.map((row:any)=>{
            return row._id;
          })

         let updated_msg:any= await group_conversation.updateMany({
            _id:{$in:update_group_message_ids}
          },
          { 
            $set: { delivery_type: 3 }
          })


          let updated_group_message_ids:any = await  group_conversation.find({
            _id:{$in:update_group_message_ids}
          }).distinct("sender_id") 

          message_sender_id_arr = updated_group_message_ids.map((row:any)=> {
            return row.toString()
          })


          let get_updated_msg:any = await group_conversation.find({
            _id:{$in:update_group_message_ids}
          })

          sender_msges_arr = get_updated_msg
          

        }
        if(!isgroup && mongoose.Types.ObjectId.isValid(uid) && mongoose.Types.ObjectId.isValid(recevier_id)){
          let get_read_message:any = await conversation.find({
            receiver_id:uid,
            sender_id:recevier_id,
            delivery_type:2
          }).distinct("_id")

          sender_msges_id_arr = get_read_message


          let get_read_message_obj:any = await conversation.find({
            receiver_id:uid,
            sender_id:recevier_id,
            delivery_type:2
          })

          let updated_one_to_msg:any = await conversation.updateMany({
            receiver_id:uid,
            sender_id:recevier_id,
            delivery_type:2
          },
          {
            $set: { delivery_type: 3 }
          })


        

          sender_msges_arr = get_read_message_obj
          message_sender_id_arr.push(recevier_id)

          
        }

      await Promise.all(
        socket_users.map(async (item) => {
          if (item.uid.toString() === uid.toString() && item.cid.toString() === cid.toString()) {
            let post:any = {
              uid:uid,
              recevier_id:recevier_id,
              isgroup:isgroup,
              cid:cid,
              message_sender_id_arr:sender_msges_id_arr
            }
            io.to(item.socket_id).emit("ack_read_all_delivered_message", post);
          }
          if(item.uid.toString() !== uid.toString() && message_sender_id_arr.includes(item.uid) && item.cid.toString() === cid.toString()){
            let get_sender_message_tmp:any = sender_msges_arr.filter((row:any)=>row.sender_id.toString() === item.uid.toString())
            let updated_message_id:any = get_sender_message_tmp.map((row:any)=>{
              return row._id;
            })
            let post:any = {
              uid:uid,
              recevier_id:recevier_id,
              isgroup:isgroup,
              cid:cid,
              message_sender_id_arr:updated_message_id
            }
            io.to(item.socket_id).emit("receive_read_all_delivered_message", post);
          }
        })
      );
        


      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    })
    socket.on("call_start_time_update", async function (data: any) {
      try {
        let call_id:any = data.call_id;
        let uid = data.uid;

        let localtime_date = moment().local().format('YYYY-MM-DDTHH:mm:ss.sssZ');
        
        let get_year:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("YYYY")
        let get_month:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("MM")
        let get_day:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("DD")
        let get_hour:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("HH")
        let get_minutes:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("mm")
        let get_seconds:any = moment(localtime_date,"YYYY-MM-DDTHH:mm:ss.sssZ").format("ss")

        let get_int_month:any = parseFloat(get_month) - 1

       
       let new_tmp_date:any = new Date();
       new_tmp_date.setUTCFullYear(get_year)
       new_tmp_date.setUTCMonth(get_int_month)
       new_tmp_date.setUTCDate(get_day)
       new_tmp_date.setUTCHours(get_hour)
       new_tmp_date.setUTCMinutes(get_minutes)
       new_tmp_date.setUTCSeconds(get_seconds)

        let update_call_detail = await call_history.findOneAndUpdate({
          call_id:call_id
        },{
          call_start_time:new_tmp_date
        })

        const mySocketIds: any[] = [];
        await Promise.all(
          socket_users.map(async (item) => {
            if (uid == item.uid) {
              mySocketIds.push(item.socket_id);
            } 
          })
        );

         if (mySocketIds.length > 0) {
          io.to(mySocketIds).emit("ack_call_start_time_update",{
            call_id:call_id,
            uid:uid
          });
        }

      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    });
    socket.on("call_switch_camera", async function (data: any) {
      try {
          let reciver_id: any[] = data.reciver_id

           const mySocketIds: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (
                  reciver_id.includes(item.uid.toString())
              ) {
                mySocketIds.push(item.socket_id);
              } 
            })
          );

          if (mySocketIds.length > 0) {
            io.to(mySocketIds).emit("ack_call_switch_camera",data);
          }

      } catch (error: any) {
        if (data.uid !== undefined && data.uid !== null) {
          const emiter_arr: any[] = [];
          await Promise.all(
            socket_users.map(async (item) => {
              if (item.uid.toString() === data.uid.toString()) {
                emiter_arr.push(item.socket_id);
              }
            })
          );
          if (emiter_arr.length > 0) {
            let get_error: any = JSON.stringify(error.toString());
            io.to(emiter_arr).emit("Socket_emit_error", get_error);
          }
        }
      }
    });
    socket.on("disconnect", async () => {
      let offlineUser = socket_users.find(
        (item) => item.socket_id === socket.id
      );

      if (offlineUser) {
        let get_user_all_devices:any[]= socket_users.filter((row)=>row.uid.toString() === offlineUser.uid.toString())
        if(get_user_all_devices.length == 1){
        let user_detail_get: any = await user.findByIdAndUpdate(
          {
            _id: offlineUser.uid,
          },
          {
            is_online: 0,
            last_seen: new Date()
          },
          {
            new: true,
            runValidators: true,
          }
        );

        const mySocketIds: any[] = [];

        await Promise.all(
          socket_users.map(async (item) => {
            if (
              item.uid !== offlineUser.uid &&
              item.cid === offlineUser.cid
            ) {
              mySocketIds.push(item.socket_id);
            }
          })
        );
        let post = {
          _id: offlineUser.uid,
          is_online: 0,
          last_seen:user_detail_get ? user_detail_get.last_seen:null
        };
        if (mySocketIds.length > 0) {
          io.to(mySocketIds).emit("send_online_status", post);
        }
      }
      }
      socket_users = socket_users.filter(
        (item) => item.socket_id !== socket.id
      );
    });
  }});
}
