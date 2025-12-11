import Joi from "joi";

export const giftListSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  customer_email: Joi.string().email().required(),
});

export const giftListItemSchema = Joi.object({
  product_id: Joi.string().required(),
  variant_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

