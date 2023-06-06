express = require("express");
const bcrypt = require("bcrypt");
const { auth } = require("../middlewares/auth");
const { ToyModel, validateToy } = require("../models/toyModel")
const router = express.Router();


// http://localhost:3000/toys
router.get("/", async (req, res) => {
   
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "price";
    let reverse = req.query.reverse == "yes" ? -1 : 1;

    try {
        let data = await ToyModel
            .find({})
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse })
        res.json(data);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }

})

// http://localhost:3000/toys/search?s=poker
router.get("/search", async (req, res) => {

    let perPage = req.query.perPage || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "price";

    try {
        let queryS = req.query.s.toLowerCase();
        let searchReg = new RegExp(queryS, "i");

        let data = await ToyModel.find({
            $or: [
                { name: searchReg },
                { info: searchReg }
            ]
        })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: 1 });

        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There is an error, please try again later", err });
    }
});

// http://localhost:3000/toys/prices?min=100&max=150
router.get("/prices", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "price";
    let reverse = req.query.reverse == "yes" ? -1 : 1;

    let min = req.query.min || 30;
    let max = req.query.max || Infinity;
    try {
        let data = await ToyModel.find({ price: { $gte: min, $lte: max } })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse })
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There is an error, please try again later", err });
    }
});

// http://localhost:3000/toys/categories/puzzles
router.get("/categories/:catName", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "price";
    let reverse = req.query.reverse == "yes" ? -1 : 1;


    let catName = req.params.catName.toLowerCase();
    let searchReg = new RegExp(catName, "i");
    try {
        let data = await ToyModel.find({ category: searchReg })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse })
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There is an error, please try again later", err });
    }
});

// http://localhost:3000/toys/single/:id
router.get("/single/:id", async (req, res) => {
    let id = req.params.id;
    try {
        let data = await ToyModel.findById(id);
        if (!data) {
            return res.json({ msg: "Toy is not found!" });
        }
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error", err });
    }
});

// http://localhost:3000/toys    -> send token admin or user
router.post("/", auth, async (req, res) => {
    let valdiateBody = validateToy(req.body);
    if (valdiateBody.error) {
        return res.status(400).json(valdiateBody.error.details)
    }
    try {
        let toy = new ToyModel(req.body);
        toy.user_id = req.tokenData._id;
        await toy.save();
        res.status(201).json(toy)
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})



// http://localhost:3000/toys/:idEdit     -> send token admin or user
router.put("/:idEdit", auth, async (req, res) => {
    let validateBody = validateToy(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details)
    }
    try {
        let idEdit = req.params.idEdit;
        let data;

        if (req.tokenData.role == "ADMIN") {
            data = await ToyModel.updateOne({ _id: idEdit }, req.body)
        }
        else if (idEdit == req.tokenData._id) {
            data = await ToyModel.updateOne({ _id: idEdit, user_id: req.tokenData._id }, req.body)
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

// http://localhost:3000/toys/:idDel     -> send token admin or user
router.delete("/:idDel", auth, async (req, res) => {
    try {
        let idDel = req.params.idDel;
        let data;
        if (req.tokenData.role == "ADMIN") {
            data = await ToyModel.deleteOne({ _id: idDel })
        }
        else {
            data = await ToyModel.deleteOne({ _id: idDel, user_id: req.tokenData._id })
        }
        res.json(data);
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "There is an error please try again", err })
    }
})


module.exports = router
