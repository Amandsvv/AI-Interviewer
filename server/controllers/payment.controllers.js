import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";
import crypto from 'crypto';

export const createOrder = async(req, res) => {
    try {
        const {planId, amount, credits} = req.body;
        if(!amount || !credits) {
            return res.status(400).json({message : "Invalid plan data"});
        }

        const options = {
            amount : amount * 100,
            currency : "INR",
            receipt : `receipt_${Date.now()}`
        }

        const order = await razorpay.orders.create(options);
        await Payment.create({
            userId : req.userId,
            planId,
            amount,
            credits,
            razorpayOrderId : order.id,
            status : "created",
        });

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({message : `failed to create razor pay order due to : ${error}`})
    }
}

export const verifyPayment = async(req, res) => {
    try {
        const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

        if(expectedSignature !== razorpay_signature){
            return res.status(400).json({message : "Invalid Payment Signature"});
        }

        const payment = await Payment.findOne({
            razorpayOrderId : razorpay_order_id
        })

        if(!payment){
            return res.status(400).json({message : "Payment not found."});
        }

        if(payment.status === "paid"){
            return res.json({message : "Payment Already Processed"});

        }

        //Update Status
        payment.status = "paid";
        payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();

        const updateUser = await User.findByIdAndUpdate(payment.userId, {$inc : {credits : payment.credits}
        },{new : true})

        return res.status(200).json({
            success : true,
            user: updateUser,
            message : "Payment Completed"
        });

    } catch (error) {
        return res.status(500).json({message : `Failed to verify Razorpay Order : ${error}`});
    }
}