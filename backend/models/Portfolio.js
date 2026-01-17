const mongoose=require("mongoose");
const portfolioSchema=new mongoose.Schema(
    {
        client:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Client",
            required:true
        },
        agent:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Agent",
            required:true
        }
    },
    {
       timestamps:true
    }
);
module.exports=mongoose.model("Portfolio",portfolioSchema);