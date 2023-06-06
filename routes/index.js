const express=require("express");
const router=express.Router();

router.get("/", (req,res)=>{
    res.json({msg:"Rest Api Toys is working!!"})
})

module.exports=router;

