const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { uploadFile } = require("../aws-service/aws");

const { json } = require("body-parser");

const saltRounds = 10;

const userModel = require("../models/userModel");

const { isValidData, isValidRequestBody, isValidEmail, isValidPhone, pincodeValid, isValidObjectId } = require("../validator/validation");

//********************< Create User Starts >*********************//

const userRegister = async function (req, res) {
    try {

        let requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }
        // Extract all attribute destructure
        let { fname, lname, email, phone, profileImage, password, address } = requestBody;
        // Validation starts--------------

        if (!isValidData(fname)) {
            return res.status(400).send({ status: false, message: "First name is required." });
        }

        if (!isValidData(lname)) {
            return res.status(400).send({ status: false, message: " Last name is required." });
        }

        if (!isValidData(email)) {
            return res.status(400).send({ status: false, message: "Email is required." });
        }

        if (!isValidEmail.test(email)) {
            return res.status(400).send({ status: false, message: "Please enter valid a email " });
        }

        let duplicateEmail = await userModel.findOne({ email });
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: "Email already exist" });
        }

        if (!isValidData(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required." });
        }

        if (!isValidPhone.test(phone)) {
            return res.status(400).send({ status: false, message: "Please enter a valid phone number" });
        }

        let duplicatePhone = await userModel.findOne({ phone });
        if (duplicatePhone) {
            return res.status(400).send({ status: false, msg: "Phone number already exist" });
        }

        if (!isValidData(password)) {
            return res.status(400).send({ status: false, message: "Password is required." });
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Password should be minimum 8 characters and maximum 15 characters", });
        }

        // hashing password
        requestBody.password = await bcrypt.hash(password, saltRounds);

        // validation for address of shipping
        if (!isValidData(address.shipping.street)) return res.status(400).send({ status: false, message: "Shipping street is required." });
        if (!isValidData(address.shipping.city)) return res.status(400).send({ status: false, message: "Shipping city is required." });
        if (!isValidData(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is required." });
        if (!pincodeValid.test(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is incorrect." });

        // validation for address of shipping
        if (!isValidData(address.billing.street)) return res.status(400).send({ status: false, message: "Billing street is required." });
        if (!isValidData(address.billing.city)) return res.status(400).send({ status: false, message: "Billing city is required." });
        if (!isValidData(address.billing.pincode)) return res.status(400).send({ status: false, message: "Billing pincode is required." });
        if (!pincodeValid.test(address.billing.pincode)) return res.status(400).send({ status: false, message: "Billing pincode is incorrect." });


        if (!isValidData(address.billing.street)) {
            return res.status(400).send({ status: false, message: "Billing street is required." });
        }

        if (!isValidData(address.billing.city)) {
            return res.status(400).send({ status: false, message: "Billing city is required." });
        }

        if (!isValidData(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Billing pincode is required." });
        }

        if (!pincodeValid.test(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Billing pincode is incorrect." });
        }

        let files = req.files;

        if (!isValidRequestBody(files)) {
            return res.status(400).send({ status: false, message: "Upload a image." });
        }

        if (files && files.length > 0) {
            profileImage = await uploadFile(files[0]);
        }

        // Add profileImage
        requestBody.profileImage = profileImage;

        let hash = bcrypt.hashSync(password, saltRounds);

        let data = { fname, lname, email, profileImage, phone, password: hash, address }

        let creatUser = await userModel.create(data);

        res.status(201).send({ status: true, message: "User created successfully", data: creatUser })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//********************< Create User Ends >*********************//



//////////////////// loginUser//////////////////////////////////////////////

const loginUser = async (req, res) => {
    try {

        let data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No data provided" });
        let { email, password } = data

        if (!isValidData(email)) {
            return res.status(400).send({ status: false, message: "email is required." });
        }

        if (!isValidEmail.test(email)) {
            return res.status(400).send({ status: false, message: "Please enter valid a email " });
        }

        let checkEmail = await userModel.findOne({ email });
        if (!checkEmail) return res.status(404).send({ status: false, message: `User is not present with this email:-${email}` });

        if (!isValidData(password)) {
            return res.status(400).send({ status: false, message: "Password is required." });
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Password should be minimum 8 characters and maximum 15 characters", });
        }

        let decript = await bcrypt.compare(password, checkEmail.password)

        if (!decript) return res.status(400).send({ status: false, message: "Password is wrong" });

        let token = jwt.sign({
            userId: checkEmail._id,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 60)
        }, "//groupNumber_15||best_coders//")

        res.setHeader("authorization", "bearerToken", token)

        res.status(200).send({ status: true, message: "User login successfull", data: { userId: checkEmail._id, token } })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


const getUser = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!isValidObjectId.test(userId)) {
            return res.status(400).send({ status: false, message: "Invalid user id" })
        }

        // Authorization
        if (req.userId != userId) {
            return res.status(401).send({ status: false, message: "You're not authorized" })
        }

        let findUserId = await userModel.findById({ _id: userId });
        if (!findUserId) {
            return res.status(404).send({ status: false, message: "User doesn't exists" })
        }

        res.status(200).send({ status: true, message: "User profile details", data: findUserId })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};


const updateUserDetails = async function (req, res) {
    try {

        let userId = req.params.userId;

        let bodyData = req.body;

        if (!isValidObjectId.test(userId)) {
            return res.status(400).send({ status: false, message: "Invalid user id" })
        }

        if (!isValidRequestBody(bodyData)) return res.status(400).send({ status: false, message: "No data provided" });


        // Authorization
        if (req.userId != userId) {
            return res.status(401).send({ status: false, message: "You're not Authorized" })
        }

        const { fname, lname, email, phone, profileImage, password, address } = bodyData;

        let updateUser = {};

        if (fname) {
            if (!isValidData(fname)) {
                return res.status(400).send({ status: false, message: "Enter some data" });
            }
            updateUser["fname"] = fname;
        }

        if (lname) {
            if (!isValidData(fname)) {
                return res.status(400).send({ status: false, message: "Enter some data" });
            }
            updateUser["lname"] = lname;
        }

        if (profileImage) {
            if (files && files.length > 0) {
                profileImage = await uploadFile(files[0]);
            }
            updateUser["profileImage"] = profileImage;
        }

        if (email) {
            if (!isValidEmail.test(email)) {
                return res.status(400).send({ status: false, message: "Please enter valid a email " });
            }

            let duplicateEmail = await userModel.findOne({ email });
            if (duplicateEmail) {
                return res.status(400).send({ status: false, msg: "Email already exist" });
            }
            updateUser["email"] = email;
        }

        if (password) {
            if (!(password.length >= 8 && password.length <= 15)) {
                return res.status(400).send({ status: false, msg: "Password should be minimum 8 characters and maximum 15 characters", });
            }

            let hash = bcrypt.hashSync(password, saltRounds);
            updateUser["password"] = hash;
        }

        if (phone) {
            if (!isValidPhone.test(phone)) {
                return res.status(400).send({ status: false, message: "Please enter a valid phone number" });
            }

            let duplicatePhone = await userModel.findOne({ phone });
            if (duplicatePhone) {
                return res.status(400).send({ status: false, msg: "Phone number already exist" });
            }
            updateUser["phone"] = phone;
        }

        if (address) {
            if (address.shipping) {
                if (address.shipping.street) {
                    updateUser['address.shipping.street'] = address.shipping.street
                }

                if (address.shipping.city) {
                    updateUser['address.shipping.city'] = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!pincodeValid.test(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "Shipping pincode is incorrect." });
                    }
                    updateUser['address.shipping.pincode'] = address.shipping.pincode;
                }
            }

            if (address.billing) {
                if (address.billing.street) {
                    updateUser['address.billing.street'] = address.billing.street
                }

                if (address.billing.city) {
                    updateUser['address.billing.city'] = address.billing.city
                }

                if (address.billing.pincode) {
                    if (!pincodeValid.test(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "Billing pincode is incorrect." });
                    }
                    updateUser['address.billing.pincode'] = address.billing.pincode;
                }
            }
        }

        let result = await userModel.findByIdAndUpdate(userId, updateUser, { new: true });

        res.status(200).send({ status: true, message: "User profile update", data: result });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}






module.exports = { userRegister, loginUser, getUser, updateUserDetails };
