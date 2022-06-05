const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");

const { isValidData, isValidRequestBody, isValidObjectId, isValidPrice, isValidEnum } = require("../validator/validation");



// **************************************< Create Order >*******************************************


const createOrder = async (req, res) => {
  try {

    let userId = req.params.userId;

    if (!isValidObjectId.test(userId)) {
      return res.status(400).send({ status: false, message: "Invalid user id" });
    }

    let findUserId = await userModel.findById({ _id: userId });

    if (!findUserId) {
      return res.status(404).send({ status: false, message: "User doesn't exists" });
    }

    // Authentice and Authorized
    if (req.userId != userId) {
      return res.status(401).send({ status: false, message: "You're not Authorized" })
    }

    const orderData = req.body;
    if (!isValidRequestBody(orderData)) {
      return res.status(400).send({ status: false, message: "No data provided" });
    }

    let { cartId, cancellable, status } = orderData;

    orderData["userId"] = userId;

    if (!isValidObjectId.test(cartId)) {
      return res.status(400).send({ status: false, message: "invalid cartId" });
    }

    let findCartId = await cartModel.findById({ _id: cartId })
    if (!findCartId) {
      return res.status(404).send({ status: false, message: "cartId doesn't exists" });
    }

    if (findCartId.items.length == 0) {
      return res.status(400).send({ status: false, message: "Your cart is empty." })
    }


    if (userId !== findCartId.userId.toString())
      return res.status(404).send({ status: false, message: "cart's userId didn't match with userId", });

    if (status) {
      if (!["pending", "completed", "cancelled"].includes(status))
        return res.status(400).send({ status: false, message: `status includes only pending, completed, cancelled` });
    }

    let findCartDetails = await cartModel.findById(cartId);
    // console.log(findCartDetails.items[0].quantity);

    orderData["items"] = findCartDetails.items
    orderData["totalItems"] = findCartDetails.totalItems;

    let totalQuantity = 0;
    for (let i = 0; i < findCartDetails.items.length; i++) {
      totalQuantity += findCartDetails.items[i].quantity;
    }

    orderData["totalQuantity"] = totalQuantity
    // console.log(totalQuantity)

    orderData["totalPrice"] = findCartDetails.totalPrice;

    let creatOrder = await orderModel.create(orderData);
    await cartModel.findByIdAndUpdate(cartId, { $set: { items: [], totalItems: 0, totalPrice: 0 } })

    res.status(201).send({ status: true, data: creatOrder });

  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};


// ********************************************< update Order >*********************************************

const updateOrder = async (req, res) => {

  try {

    let userId = req.params.userId;

    if (!isValidObjectId.test(userId)) {
      return res.status(400).send({ status: false, message: "Invalid user id" });
    }

    let findUserId = await userModel.findById({ _id: userId });

    if (!findUserId) {
      return res.status(404).send({ status: false, message: "User doesn't exists" });
    }

    // Authentice and Authorized
    if (req.userId != userId) {
      return res.status(401).send({ status: false, message: "You're not Authorized" });
    }

    let orderId = req.body.orderId;

    if (!isValidObjectId.test(orderId)) {
      return res.status(400).send({ status: false, message: "Invalid order id" });
    }

    let findOrderId = await orderModel.findById({ _id: orderId });
    if (!findOrderId) {
      return res.status(404).send({ status: false, message: "Order doesn't exists" });
    }

    if (userId !== findOrderId.userId.toString()) {
      return res.status(404).send({ status: false, message: "Order's userId didn't match with userId", });
    }

    if (findOrderId.cancellable == true) {

      let updateStatus = await orderModel.findByIdAndUpdate(orderId, { $set: { status: "complete" } }, { new: true });

      return res.status(200).send({ status: true, message: "Order completed Successfully", data: updateStatus });

    } else {
      return res.status(400).send({ status: false, message: "Your order isn't cancellable." });
    }

  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
}

module.exports = { createOrder, updateOrder };