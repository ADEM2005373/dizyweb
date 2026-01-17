const mongoose=require("mongoose");
const notificationSchema=new mongoose.Schema(
    {
        utilisateur:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:false  // Make optional for system notifications
        },
        message:{
            type:String,
            required:true 
        },
        lu:{
            type:Boolean,
            required:true 
        },
        date:{
            type:Date,
            required: true 
        }
    } ,
    {
        timestamps:true 
    }
);
module.exports=mongoose.model("Notification",notificationSchema);