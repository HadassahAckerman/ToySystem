

express = require("express");
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { UserModel, validateUser, validateLogin, createToken } = require("../models/userModel");
const { ToyModel } = require("../models/toyModel");
const router = express.Router();

// http://localhost:3000/users/usersList    -> send only token admin 
router.get("/usersList", authAdmin, async (req, res) => {
    try {
        let data = await UserModel.find({}, { password: 0 });
        res.json(data)

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err })
    }
})

// http://localhost:3000/users/myInfo    -> send token admin or user
router.get("/myInfo", auth, async (req, res) => {
    try {
        let userInfo = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
        res.json(userInfo);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }


})

// http://localhost:3000/users    -> send name, email, password and role in the body
router.post("/", async (req, res) => {
    let validBody = validateUser(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        let user = new UserModel(req.body);
        user.password = await bcrypt.hash(user.password, 10);

        await user.save();
        user.password = "*********";
        res.status(201).json(user);
    }
    catch (err) {
        if (err.code == 11000) {
            return res.status(500).json({ msg: "Email already in system, try log in", code: 11000 })

        }
        console.log(err);
        res.status(500).json({ msg: "err", err })
    }
})

// http://localhost:3000/users/login     -> send email and password in the body
router.post("/login", async (req, res) => {
    let validBody = validateLogin(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        let user = await UserModel.findOne({ email: req.body.email })
        if (!user) {
            return res.status(401).json({ msg: "Password or email is wrong ,code:2" })
        }
        let authPassword = await bcrypt.compare(req.body.password, user.password);
        if (!authPassword) {
            return res.status(401).json({ msg: "Password or email is wrong ,code:1" });
        }
        let token = createToken(user._id, user.role);
        res.json({ token });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})


// http://localhost:3000/users/:idEdit     -> send token admin or user
router.put("/:idEdit", auth, async (req, res) => {
    let validateBody = validateUser(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details)
    }
    try {
        let idEdit = req.params.idEdit;
        let data;

        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        if (req.tokenData.role == "ADMIN") {
            data = await UserModel.updateOne({ _id: idEdit }, req.body)
        }
        else if (idEdit == req.tokenData._id) {
            data = await UserModel.updateOne({ _id: idEdit }, req.body)
        }
        else {
            return res.status(401).json({ msg: "Sorry, you do not have permission to update" });
        }
        res.json(data)

    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "There is an error please try again", err })
    }
})

// http://localhost:3000/users/:idDel     -> send token admin or user
router.delete("/:idDel", auth, async (req, res) => {
    try {
        let idDel = req.params.idDel;
        let data;
        if (req.tokenData.role == "ADMIN") {
            data = await UserModel.deleteOne({ _id: idDel })
        }
        else if (idDel == req.tokenData._id) {
            data = await UserModel.deleteOne({ _id: idDel })

        }
        else {
            return res.status(401).json({ msg: "You cannot delete another user!" })
        }
        res.json(data);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "There is an error please try again", err })
    }
})




module.exports = router